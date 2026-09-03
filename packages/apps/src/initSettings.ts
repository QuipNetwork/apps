// Copyright 2017-2026 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

import queryString from 'query-string';
import store from 'store';

import { createWsEndpoints } from '@polkadot/apps-config';
import { extractIpfsDetails } from '@polkadot/react-hooks/useIpfs';
import { settings } from '@polkadot/ui-settings';
import { assert } from '@polkadot/util';

// Quip: the portal's default endpoint for a visitor with no saved choice.
// bootnode-1 and -2 stay selectable in the picker; see apps-config's quip.ts.
//
// Pinned here rather than left to the build-time WS_URL or to upstream's
// "first entry in the list" fallback, neither of which yields bootnode-3: with
// WS_URL baked the check below short-circuits before the fallback is reached,
// and the fallback itself resolves to bootnode-1 because expandEndpoint sorts
// providers alphabetically by display name.
const QUIP_DEFAULT_URL = 'wss://bootnode-3.aglais.quip.network:20049/rpc';

function networkOrUrl (apiUrl: string): void {
  if (apiUrl.startsWith('light://')) {
    console.log('Light endpoint=', apiUrl.replace('light://', ''));
  } else {
    console.log('WS endpoint=', apiUrl);
  }
}

function getApiUrl (): string {
  // we split here so that both these forms are allowed
  //  - http://localhost:3000/?rpc=wss://substrate-rpc.parity.io/#/explorer
  //  - http://localhost:3000/#/explorer?rpc=wss://substrate-rpc.parity.io
  const urlOptions = queryString.parse(location.href.split('?')[1]);

  // if specified, this takes priority
  if (urlOptions.rpc) {
    assert(!Array.isArray(urlOptions.rpc), 'Invalid WS endpoint specified');

    // https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944#/explorer;
    const url = decodeURIComponent(urlOptions.rpc.split('#')[0]);

    assert(url.startsWith('ws://') || url.startsWith('wss://') || url.startsWith('light://'), 'Non-prefixed ws/wss/light url');

    return url;
  }

  const endpoints = createWsEndpoints(<T = string>(): T => ('' as unknown as T));
  const { ipnsChain } = extractIpfsDetails();

  // check against ipns domains (could be expanded to others)
  if (ipnsChain) {
    const option = endpoints.find(({ dnslink }) => dnslink === ipnsChain);

    if (option) {
      return option.value;
    }
  }

  const stored = store.get('settings') as Record<string, unknown> || {};

  // A choice this visitor previously made always wins, so returning to the
  // portal never resets the endpoint they picked. Everyone else gets the Quip
  // default.
  //
  // `stored.apiUrl` rather than `settings.apiUrl`: the latter already folds in
  // WS_URL and ENDPOINT_DEFAULT (see ui-settings/Settings.js), so it cannot
  // distinguish a real user choice from the baked environment.
  return typeof stored.apiUrl === 'string' && stored.apiUrl
    ? stored.apiUrl
    : QUIP_DEFAULT_URL;
}

// There cannot be a Substrate Connect light client default (expect only jrpc EndpointType)
const apiUrl = getApiUrl();

// set the default as retrieved here
settings.set({ apiUrl });

networkOrUrl(apiUrl);
