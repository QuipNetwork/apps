# Quip hybrid-signature integration for the polkadot-js apps fork.
#
# The Quip transaction signer (sr25519 + ML-DSA-44 hybrid) lives in the
# `quip-protocol-rs` git submodule, pinned to a specific commit. Its browser
# WASM is a generated, git-ignored artifact, so it must be built locally before
# the dev signer (packages/apps/src/initQuipSigner.ts) can load it.
#
# Usage:
#   make quip-signer   # init submodule + build the hybrid-signer WASM
#
# Requires `wasm-pack` (cargo install wasm-pack) and the Rust toolchain.

QUIP_SUBMODULE := quip-protocol-rs

.PHONY: quip-signer quip-submodule

# Default target builds everything needed for hybrid-sig support.
all: quip-signer

# Check out the submodule at its pinned commit (idempotent).
quip-submodule:
	git submodule update --init $(QUIP_SUBMODULE)

# Build the git-ignored hybrid-signer WASM inside the submodule. The submodule's
# own `wasm-signer` target runs wasm-pack and writes the artifacts into
# quip-protocol-rs/js/quip-transaction-crypto-wasm/, which is exactly where
# initQuipSigner.ts imports them from.
quip-signer: quip-submodule
	$(MAKE) -C $(QUIP_SUBMODULE) wasm-signer
	@echo "Hybrid signer WASM ready. Enable it in the apps with QUIP_DEV_SIGNER=1 (or ?quipSigner)."