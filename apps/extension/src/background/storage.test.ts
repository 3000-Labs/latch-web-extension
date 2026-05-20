import { describe, expect, it } from 'vitest'
import { createAccount, getAccounts, migrateLegacyPublicKeyIfNeeded } from './storage'

describe('background/storage', () => {
  it('createAccount persists account and sets activeAccountId on first insert', async () => {
    await createAccount({
      mode: 'passkey' as any,
      smartAccountAddress: 'GSMARTACCOUNT',
      passkeyCredentialId: 'cred',
      passkeyKeyDataHex: 'deadbeef',
    })

    const { accounts, activeAccountId } = await getAccounts()
    expect(accounts).toHaveLength(1)
    expect(activeAccountId).toBe(accounts[0]!.id)
    expect(accounts[0]!.mode).toBe('passkey')
    expect(accounts[0]!.smartAccountAddress).toBe('GSMARTACCOUNT')
  })

  it('migrateLegacyPublicKeyIfNeeded creates a placeholder account once', async () => {
    await chrome.storage.local.set({ 'latch.accountPublicKey': 'GLEGACY' })

    await migrateLegacyPublicKeyIfNeeded()
    const first = await getAccounts()
    expect(first.accounts).toHaveLength(1)
    expect(first.accounts[0]!.mode).toBe('freighter')

    await migrateLegacyPublicKeyIfNeeded()
    const second = await getAccounts()
    expect(second.accounts).toHaveLength(1)
  })
})
