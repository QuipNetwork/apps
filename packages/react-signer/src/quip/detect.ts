// Copyright 2017-2026 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair } from '@polkadot/keyring/types';

type QuipMeta = {
  isQuipHybrid?: boolean;
  quipCryptoType?: string;
  type?: string;
};

function asQuipMeta (pair: KeyringPair): QuipMeta {
  return pair.meta as unknown as QuipMeta;
}

export function isQuipHybridPair (pair: KeyringPair): boolean {
  const meta = asQuipMeta(pair);

  return meta.isQuipHybrid === true ||
    meta.quipCryptoType === 'sr25519_mldsa44' ||
    meta.type === 'sr25519_mldsa44';
}

