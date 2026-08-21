# Quip hybrid-signature integration for the polkadot-js apps fork.
#
# The Quip transaction signer (H4 sr25519 + FN-DSA-512 hybrid) lives in the
# `quip-validator` git submodule, pinned to a specific commit. Its browser
# WASM is a generated, git-ignored artifact, so it must be built locally before
# the dev signer (packages/apps/src/initQuipSigner.ts) can load it.
#
# Usage:
#   make quip-signer   # init submodule + (re)build the hybrid-signer WASM
#   make start         # build WASM if missing, then run the dev server with
#                      # the Quip hybrid signer enabled
#
# Requires `wasm-pack` (cargo install wasm-pack) and the Rust toolchain.

QUIP_SUBMODULE := quip-validator
WASM_OUT := $(QUIP_SUBMODULE)/js/quip-transaction-crypto-wasm/quip_transaction_crypto_wasm_bg.wasm

.PHONY: all quip-signer quip-submodule start

# Default target builds everything needed for hybrid-sig support.
all: quip-signer

# Check out the submodule at its pinned commit (idempotent).
quip-submodule:
	git submodule update --init $(QUIP_SUBMODULE)

# Build the git-ignored hybrid-signer WASM inside the submodule. The submodule's
# own `wasm-signer` target runs wasm-pack and writes the artifacts into
# quip-validator/js/quip-transaction-crypto-wasm/, which is exactly where
# initQuipSigner.ts imports them from. Always rebuilds.
quip-signer: quip-submodule
	$(MAKE) -C $(QUIP_SUBMODULE) wasm-signer
	@echo "Hybrid signer WASM ready. Enable it in the apps with QUIP_DEV_SIGNER=1 (or ?quipSigner)."

# Build the WASM only when it is missing (so `make start` doesn't recompile the
# crate every run). Run `make quip-signer` explicitly to force a rebuild.
$(WASM_OUT):
	$(MAKE) quip-signer

# Start the apps dev server (webpack-serve on :3000) with the Quip hybrid signer
# injected. Builds the signer WASM first if it isn't present yet.
start: $(WASM_OUT)
	QUIP_DEV_SIGNER=1 yarn start
