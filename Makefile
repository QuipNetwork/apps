# Quip hybrid-signature integration for the polkadot-js apps fork.
#
# The Quip transaction signer (sr25519 + ML-DSA-44 hybrid) and its prebuilt
# browser WASM are VENDORED into the apps package at
#   packages/apps/src/quip-signer-vendor/
# (the signer source + the wasm-pack output). There is no git submodule and no
# Rust/wasm-pack build step: the production build is a pure-Node `yarn build:www`
# (so it works on a plain Node CI/build node, e.g. Flux Deploy-with-Git).
#
# initQuipSigner.ts loads the vendored signer when QUIP_DEV_SIGNER=1 (or the
# `?quipSigner` query param / `quip:devSigner` localStorage flag).
#
# Usage:
#   make start   # run the dev server (:3000) with the Quip hybrid signer enabled

.PHONY: start

start:
	QUIP_DEV_SIGNER=1 yarn start
