import { describe, expect, it } from 'vitest'

import type { StoredAccount } from '@latch/types'

import { findReusablePasskeyAccount, listReusablePasskeyAccounts } from './multisigPasskey'

describe('listReusablePasskeyAccounts', () => {
  it('returns all passkey accounts with credential and key data', () => {
    const accounts: StoredAccount[] = [
      { id: '1', mode: 'passkey', label: 'A', smartAccountAddress: 'G1', createdAt: 1 },
      {
        id: '2',
        mode: 'passkey',
        label: 'B',
        smartAccountAddress: 'G2',
        passkeyCredentialId: 'cred-1',
        passkeyKeyDataHex: 'abcd',
        createdAt: 1,
      },
    ]
    expect(listReusablePasskeyAccounts(accounts)).toHaveLength(1)
    expect(findReusablePasskeyAccount(accounts)?.id).toBe('2')
  })
})

describe('findReusablePasskeyAccount', () => {
  it('returns first passkey account with credential and key data', () => {
    const accounts: StoredAccount[] = [
      { id: '1', mode: 'passkey', label: 'A', smartAccountAddress: 'G1', createdAt: 1 },
      {
        id: '2',
        mode: 'passkey',
        label: 'B',
        smartAccountAddress: 'G2',
        passkeyCredentialId: 'cred-1',
        passkeyKeyDataHex: 'abcd',
        createdAt: 1,
      },
      {
        id: '3',
        mode: 'passkey',
        label: 'C',
        smartAccountAddress: 'G3',
        passkeyCredentialId: 'cred-2',
        passkeyKeyDataHex: 'ef01',
        createdAt: 1,
      },
    ]
    expect(findReusablePasskeyAccount(accounts)?.id).toBe('2')
  })

  it('returns undefined when no passkey has both fields', () => {
    const accounts: StoredAccount[] = [
      { id: '1', mode: 'freighter', label: 'F', smartAccountAddress: 'G1', createdAt: 1 },
      {
        id: '2',
        mode: 'passkey',
        label: 'P',
        smartAccountAddress: 'G2',
        passkeyCredentialId: 'cred-1',
        createdAt: 1,
      },
    ]
    expect(findReusablePasskeyAccount(accounts)).toBeUndefined()
  })
})
