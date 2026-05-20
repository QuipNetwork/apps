// Copyright 2017-2026 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Signer, SignerResult } from '@polkadot/api/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { Registry, SignerPayloadJSON } from '@polkadot/types/types';

import { lockAccount } from '../util.js';

export class QuipAccountSigner implements Signer {
  readonly #keyringPair: KeyringPair;
  readonly #registry: Registry;

  constructor (registry: Registry, keyringPair: KeyringPair) {
    this.#keyringPair = keyringPair;
    this.#registry = registry;
  }

  public async signPayload (_payload: SignerPayloadJSON): Promise<SignerResult> {
    lockAccount(this.#keyringPair);

    throw new Error(
      'Quip hybrid local signing is not implemented yet. ' +
      'This account is routed through the dedicated Quip signer path, but the sr25519_mldsa44 backend is still missing.'
    );
  }
}

