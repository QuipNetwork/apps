// Copyright 2017-2026 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { GenericExtrinsicSignatureV4 } from '@polkadot/types';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const STORAGE_KEY = 'quip:devSigner';

const DEV_SEEDS = [
  {
    name: 'Quip Alice',
    seedHex: '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a'
  },
  {
    name: 'Quip Bob',
    seedHex: '0x398f0c28f98885e046333d4a41c19cee4c37368a9832c6502f6cfd182e2aef89'
  },
  {
    name: 'Quip Alice Stash',
    seedHex: '0xb90db6316bab975669a759e36b8de8acbe91065eef95cfd4ff34e9bead8f0a5f'
  }
];

interface QuipDevProvider {
  hasAccount: (address: string) => boolean;
  importMnemonic: (
    name: string,
    mnemonic: string,
    genesisHash?: string | null
  ) => Promise<{ address: string }>;
}

/**
 * Cross-package handle published on `window` so the page-accounts UI can import
 * Quip accounts without `page-accounts` importing back into the `apps` package
 * (which would be a circular dependency).
 */
export interface QuipSignerUiApi {
  canSign: (address: string) => boolean;
  importMnemonic: (name: string, mnemonic: string) => Promise<string>;
}

declare global {
  // eslint-disable-next-line no-var
  var quipSigner: QuipSignerUiApi | undefined;
}

let isInjected = false;
let quipProvider: QuipDevProvider | null = null;

function isEnabledValue (value: string | null | undefined): boolean {
  return !!value && ENABLED_VALUES.has(value.toLowerCase());
}

function isEnabledByQuery (): boolean {
  const params = new URLSearchParams(window.location.search);

  return ['quipSigner', 'quip-signer', 'quipDevSigner'].some((key) => {
    if (!params.has(key)) {
      return false;
    }

    const value = params.get(key);

    return value === '' || value === null || isEnabledValue(value);
  });
}

function isEnabledByStorage (): boolean {
  try {
    return isEnabledValue(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

export function shouldInjectQuipSigner (): boolean {
  // The page-memory seed provider is intentionally development-only. Query
  // parameters and localStorage must never turn it on in a production bundle.
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  return isEnabledValue(process.env.QUIP_DEV_SIGNER) ||
    isEnabledByQuery() ||
    isEnabledByStorage();
}

export async function initQuipSigner (): Promise<void> {
  if (isInjected || !shouldInjectQuipSigner()) {
    return;
  }

  isInjected = true;

  const [signerModule, wasmModule] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- signer source intentionally lives outside this package's rootDir
    import('../../../../quip-validator/js/quip-signer/src/index.js'),
    import('../../../../quip-validator/js/quip-transaction-crypto-wasm/quip_transaction_crypto_wasm.js')
  ]);

  await wasmModule.default();

  // Quip's hybrid signature envelope (1660 bytes) is larger than polkadot-js's hardcoded
  // 256-byte fake signature, which breaks `paymentInfo`/fee estimation. Patch
  // signFake to size the fake from the registry before any tx flow runs.
  signerModule.patchExtrinsicSignFake(GenericExtrinsicSignatureV4);

  const { accounts, provider } = await signerModule.DevSeedProvider.fromSeeds(wasmModule, DEV_SEEDS);

  signerModule.injectQuip({
    accounts,
    signer: new signerModule.QuipSigner(provider)
  });

  quipProvider = provider;
  globalThis.quipSigner = {
    canSign: (address) => provider.hasAccount(address),
    importMnemonic: importQuipMnemonic
  };

  console.info(`Quip dev signer injected ${accounts.length} account${accounts.length === 1 ? '' : 's'}`);
}

/** Whether the Quip dev signer has been injected this session. */
export function isQuipSignerActive (): boolean {
  return quipProvider !== null;
}

/**
 * Imports a Quip account from a BIP39 phrase (or `0x` seed hex), registering
 * its seed with the injected Quip signer and adding it to the keyring so it
 * appears in the UI and signs through the injected signer.
 */
export async function importQuipMnemonic (name: string, mnemonic: string): Promise<string> {
  if (!quipProvider) {
    throw new Error('Quip dev signer is not active');
  }

  const { address } = await quipProvider.importMnemonic(name, mnemonic, null);

  const { keyring } = await import('@polkadot/ui-keyring');

  // Use the same path the keyring uses for extension accounts: `loadInjected`
  // sets `meta.isInjected` (so react-signer routes signing through the injected
  // Quip signer) and updates the live account subject so the UI refreshes
  // without a reload. `addExternal` would instead set `isExternal`, which
  // routes to the QR signer. `loadInjected` is not in the public typings.
  (keyring as unknown as {
    loadInjected: (address: string, meta: Record<string, unknown>, type?: string) => void;
  }).loadInjected(address, { name, source: 'quip' });

  return address;
}
