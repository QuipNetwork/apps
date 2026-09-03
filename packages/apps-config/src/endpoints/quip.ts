// Copyright 2017-2026 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { EndpointOption } from './types.js';

import { nodesQuipSVG } from '../ui/logos/nodes/index.js';

// Quip Network chains.
//
// Kept in its own file rather than appended to `testing.ts` so that rebasing
// onto upstream polkadot-js/apps never conflicts inside a 30 kB upstream-owned
// array. `system_chainType` reports Live, so this does not belong under the
// "Test networks" heading either.
//
// This entry is what brands the portal. `ui.color` and `ui.logo` reach the
// running app two ways: `useEndpoint` matches the connected URL against these
// providers, and `findUiForUrl` in ./development.ts matches a build-time
// WS_URL against them. Both compare URLs by EXACT string equality, so a
// trailing slash or a different port silently drops the branding back to
// upstream's orange with a blank logo — and nothing is logged when it does.
// All three bootnodes are listed so the match survives a repoint.
//
// The colour is zinc-950 from quip-brand@b2ae38b tokens/core.css, NOT zinc-900
// (#18181b) which is the brand's own --surface-dark. getMenuHoverContrast in
// react-components/src/styles/index.ts only returns a white hover overlay below
// brightness 16; zinc-900 measures 24.2 and gets a black overlay instead, which
// on a near-black bar is a ~1.4%/channel change and reads as no hover at all.
// zinc-950 measures 9.1. See the README for the full rationale.
//
// `text` must stay plain ASCII: index.spec.ts rejects anything matching its
// emoji regex, whose U+2000..U+3300 range also catches the em dash. The em
// dash in the page title is fine; it just cannot appear here.
export const quipChains: Omit<EndpointOption, 'teleport'>[] = [
  {
    homepage: 'https://quip.network',
    info: 'quip',
    providers: {
      'Bootnode 1': 'wss://bootnode-1.aglais.quip.network:20049/rpc',
      'Bootnode 2': 'wss://bootnode-2.aglais.quip.network:20049/rpc',
      'Bootnode 3': 'wss://bootnode-3.aglais.quip.network:20049/rpc'
    },
    text: 'Aglais Testnet',
    ui: {
      color: '#09090b',
      logo: nodesQuipSVG
    }
  }
];
