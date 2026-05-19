import { describe, expect, it, vi } from 'vitest'

import type { StoredAccount } from '@latch/types'

import { buildSetupRequestFromDraft } from './sendTx'
import type { SendDraft } from '../types/send'

vi.mock('./latchEnv', () => ({
  webauthnVerifierAddressFromEnv: () => 'CVERIFIER123',
}))

describe('buildSetupRequestFromDraft', () => {
  const baseDraft: SendDraft = {
    token: {
      code: 'XLM',
      sacContractId: 'CAS3',
      assetId: 'native',
      amount: '10',
    },
    recipientAddress: 'GABC',
    amount: '1',
    inputMode: 'crypto',
  }

  const passkeyAccount: StoredAccount = {
    id: '1',
    mode: 'passkey',
    smartAccountAddress: 'CACC',
    passkeyCredentialId: 'cred',
    passkeyKeyDataHex: 'aa'.repeat(66),
    createdAt: 0,
  }

  it('includes verifierAddress and keyDataHex for passkey setup', () => {
    const req = buildSetupRequestFromDraft(baseDraft, passkeyAccount)
    expect(req).toMatchObject({
      signerType: 'passkey',
      assetId: 'native',
      keyDataHex: passkeyAccount.passkeyKeyDataHex,
      verifierAddress: 'CVERIFIER123',
    })
  })

  it('returns null when passkey keyDataHex is missing', () => {
    const req = buildSetupRequestFromDraft(baseDraft, {
      ...passkeyAccount,
      passkeyKeyDataHex: undefined,
    })
    expect(req).toBeNull()
  })
})
