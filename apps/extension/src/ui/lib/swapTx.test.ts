import { describe, expect, it } from 'vitest'

import type { BuildSendTxResponse, StoredAccount } from '@latch/types'

import { swapBuildNeedsSignerReconfigure } from './swapTx'

const passkeyAccount: StoredAccount = {
  id: '1',
  mode: 'passkey',
  smartAccountAddress: 'CC3L3ACABZIRMM5OJDQ6CFV27HWP3ITZ5GOAF6ZIAYTNFWY7AM3VXWXW',
  passkeyCredentialId: 'cred',
  passkeyKeyDataHex: 'aa'.repeat(32),
}

const freighterAccount: StoredAccount = {
  id: '2',
  mode: 'freighter',
  smartAccountAddress: 'CC3L3ACABZIRMM5OJDQ6CFV27HWP3ITZ5GOAF6ZIAYTNFWY7AM3VXWXW',
  gAddress: 'GUSER123456789012345678901234567890123456789012345678901234',
}

function baseBuild(overrides: Partial<BuildSendTxResponse> = {}): BuildSendTxResponse {
  return {
    txXdr: 'tx',
    authEntryXdr: 'auth',
    contextRuleId: 14,
    authDigestHex: 'abcd',
    validUntilLedger: 100,
    ...overrides,
  }
}

describe('swapBuildNeedsSignerReconfigure', () => {
  it('returns true for passkey when submitMethod is bundler-delegated', () => {
    expect(
      swapBuildNeedsSignerReconfigure(
        baseBuild({ submitMethod: 'bundler-delegated' }),
        passkeyAccount
      )
    ).toBe(true)
  })

  it('returns false for freighter when submitMethod is bundler-delegated', () => {
    expect(
      swapBuildNeedsSignerReconfigure(
        baseBuild({ submitMethod: 'bundler-delegated' }),
        freighterAccount
      )
    ).toBe(false)
  })

  it('returns true for legacy bundler-prefilled smart-account auth builds', () => {
    expect(
      swapBuildNeedsSignerReconfigure(
        baseBuild({
          smartAccountAuthEntryXdr: 'smart',
          delegatedGAuthEntrySynthesized: true,
        }),
        passkeyAccount
      )
    ).toBe(true)
  })

  it('returns false for normal passkey webauthn swap builds', () => {
    expect(
      swapBuildNeedsSignerReconfigure(
        baseBuild({ submitMethod: 'webauthn', delegatedGAuthEntrySynthesized: true }),
        passkeyAccount
      )
    ).toBe(false)
  })
})
