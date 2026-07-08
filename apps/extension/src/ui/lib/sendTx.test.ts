import { describe, expect, it, vi } from 'vitest'

import type { StoredAccount } from '@latch/types'

import {
  accountToSignerType,
  buildSendRequestFromDraft,
  buildSetupRequestFromDraft,
  contextRuleIdForSubmit,
  isDelegatedSendBuild,
  normalizeDelegatedBuildFields,
  resolvePasskeyAuthEntryXdr,
} from './sendTx'
import type { SendDraft } from '../types/send'

vi.mock('./latchEnv', () => ({
  webauthnVerifierAddressFromEnv: () => 'CVERIFIER123',
}))

describe('accountToSignerType', () => {
  it('maps multisig to passkey (members sign with WebAuthn, not Freighter G)', () => {
    expect(accountToSignerType('multisig')).toBe('passkey')
  })
})

describe('buildSendRequestFromDraft', () => {
  const baseDraft: SendDraft = {
    token: {
      code: 'USDC',
      sacContractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      amount: '5',
    },
    recipientAddress: 'CAN4WMQCBD2UY5E37VCTFA3YNOOHMLNX4JN3T4DQKKMMNBJBY57DNGNF',
    amount: '5',
    inputMode: 'crypto',
  }

  const multisigAccount: StoredAccount = {
    id: 'ms1',
    mode: 'multisig',
    smartAccountAddress: 'CBY4TTIDC3WY2WCEMT2M35M6W6SYW33LES4JAX2XLLZHZCN3LOWGHMZS',
    createdAt: 0,
  }

  it('uses passkey signerType without signerG for multisig accounts', () => {
    const req = buildSendRequestFromDraft(baseDraft, multisigAccount, null)
    expect(req).toMatchObject({
      signerType: 'passkey',
      smartAccountAddress: multisigAccount.smartAccountAddress,
      recipient: baseDraft.recipientAddress,
      amount: '5',
      contractId: baseDraft.token!.sacContractId,
    })
    expect(req?.signerG).toBeUndefined()
  })
})

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

  const multisigAccount: StoredAccount = {
    id: 'ms1',
    mode: 'multisig',
    smartAccountAddress: 'CMULTI',
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

  it('uses member passkey credentials when setting up a multisig wallet', () => {
    const req = buildSetupRequestFromDraft(baseDraft, multisigAccount, passkeyAccount)
    expect(req).toMatchObject({
      smartAccountAddress: 'CMULTI',
      signerType: 'passkey',
      assetId: 'native',
      keyDataHex: passkeyAccount.passkeyKeyDataHex,
      verifierAddress: 'CVERIFIER123',
      credentialId: 'cred',
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

describe('normalizeDelegatedBuildFields', () => {
  it('derives delegated template fields from authEntriesXdr indices', () => {
    const normalized = normalizeDelegatedBuildFields({
      txXdr: 'tx',
      authEntryXdr: 'legacy-auth',
      contextRuleId: 1,
      authDigestHex: 'digest',
      validUntilLedger: 100,
      submitMethod: 'delegated',
      delegatedGAuthEntrySynthesized: true,
      smartAccountAuthEntryIndex: 0,
      delegatedNativeAuthEntryIndices: [1],
      authEntriesXdr: ['smart-entry', 'g-entry'],
    })

    expect(normalized.smartAccountAuthEntryXdr).toBe('smart-entry')
    expect(normalized.gAddressEntryTemplateXdr).toBe('g-entry')
    expect(normalized.authEntryXdr).toBe('legacy-auth')
    expect(isDelegatedSendBuild(normalized)).toBe(true)
  })

  it('coerces contextRuleId to a JSON number for submit routes', () => {
    expect(contextRuleIdForSubmit({ contextRuleId: 1 } as any)).toBe(1)
    expect(contextRuleIdForSubmit({ contextRuleId: '14' } as any)).toBe(14)
    expect(contextRuleIdForSubmit({ contextRuleIds: [14] } as any)).toBe(14)
  })
})

describe('resolvePasskeyAuthEntryXdr', () => {
  it('prefers authEntriesXdr[smartAccountAuthEntryIndex] over legacy authEntryXdr', () => {
    const entry0 = 'ENTRY-0'
    const entry1 = 'ENTRY-1'
    expect(
      resolvePasskeyAuthEntryXdr({
        txXdr: 'tx',
        authEntryXdr: 'LEGACY',
        contextRuleId: 0,
        authDigestHex: 'aa',
        validUntilLedger: 1,
        authEntriesXdr: [entry0, entry1],
        smartAccountAuthEntryIndex: 1,
      })
    ).toBe(entry1)
  })
})
