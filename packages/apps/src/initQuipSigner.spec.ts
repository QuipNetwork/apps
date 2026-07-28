// Copyright 2017-2026 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="@polkadot/dev-test/globals.d.ts" />

import { shouldInjectQuipSigner } from './initQuipSigner.js';

describe('Quip development signer gating', (): void => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalQuipDevSigner = process.env.QUIP_DEV_SIGNER;

  beforeEach((): void => {
    process.env.NODE_ENV = 'test';
    delete process.env.QUIP_DEV_SIGNER;
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterAll((): void => {
    process.env.NODE_ENV = originalNodeEnv;

    if (originalQuipDevSigner === undefined) {
      delete process.env.QUIP_DEV_SIGNER;
    } else {
      process.env.QUIP_DEV_SIGNER = originalQuipDevSigner;
    }
  });

  it('is opt-in in development', (): void => {
    expect(shouldInjectQuipSigner()).toBe(false);

    process.env.QUIP_DEV_SIGNER = '1';

    expect(shouldInjectQuipSigner()).toBe(true);
  });

  it('supports the explicit local query and storage toggles', (): void => {
    window.history.replaceState({}, '', '/?quipSigner=1');
    expect(shouldInjectQuipSigner()).toBe(true);

    window.history.replaceState({}, '', '/');
    window.localStorage.setItem('quip:devSigner', 'true');
    expect(shouldInjectQuipSigner()).toBe(true);
  });

  it('cannot be enabled in a production bundle', (): void => {
    process.env.NODE_ENV = 'production';
    process.env.QUIP_DEV_SIGNER = '1';
    window.history.replaceState({}, '', '/?quipSigner=1');
    window.localStorage.setItem('quip:devSigner', 'true');

    expect(shouldInjectQuipSigner()).toBe(false);
  });
});
