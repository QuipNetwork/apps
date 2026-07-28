// Copyright 2017-2026 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Runs the canonical signer integration from the protocol repository. Keeping
// this Apps entry point avoids duplicating protocol assertions or dependency
// resolution between the two workspaces.
await import('../quip-protocol-rs/js/quip-signer/test/local-node.mjs');
