import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { StoredAccount } from '@latch/types'

const patchAccountSmartAccountAddress = vi.fn()
const getAccountsForNetwork = vi.fn()
const getActiveNetwork = vi.fn(async () => 'mainnet' as const)

vi.mock('../storage', () => ({
  patchAccountSmartAccountAddress: (...args: unknown[]) => patchAccountSmartAccountAddress(...args),
  getAccountsForNetwork: (...args: unknown[]) => getAccountsForNetwork(...args),
}))

vi.mock('../network/config', () => ({
  getActiveNetwork: () => getActiveNetwork(),
}))

import { repairDisplacedPasskeySmartAccountAddresses } from './repairPasskeyAddress'

describe('repairDisplacedPasskeySmartAccountAddresses', () => {
  beforeEach(() => {
    patchAccountSmartAccountAddress.mockReset()
    getAccountsForNetwork.mockReset()
    getActiveNetwork.mockResolvedValue('mainnet')
  })

  it('patches CCATLEKR factory address back to funded CCMC7 on both network buckets', async () => {
    const displaced: StoredAccount = {
      id: '1',
      mode: 'passkey',
      smartAccountAddress: 'CCATLEKRXNV7OXJ2OD3BHFVAZG4A2KRS6VPSD7BO6KTBL6YHX5MESRJ5',
      passkeyCredentialId: 'qLtClSe0yoil6XZcjJC-rw',
      createdAt: 0,
    }
    const restored: StoredAccount = {
      ...displaced,
      smartAccountAddress: 'CCMC7L43YL4AVKNWWQJGY6PD2ZL6N2KKGVVWZ7GMLNZM2NYB7YMLY7ET',
    }

    getAccountsForNetwork.mockImplementation(async (network: string) => {
      if (network === 'mainnet') {
        return { accounts: [displaced], activeAccountId: '1' }
      }
      return { accounts: [], activeAccountId: undefined }
    })
    patchAccountSmartAccountAddress.mockResolvedValue(restored)

    // After patch, active network read returns restored account
    getAccountsForNetwork
      .mockResolvedValueOnce({ accounts: [displaced], activeAccountId: '1' }) // testnet
      .mockResolvedValueOnce({ accounts: [displaced], activeAccountId: '1' }) // mainnet scan
      .mockResolvedValueOnce({ accounts: [restored], activeAccountId: '1' }) // final active read

    // Simpler: always return displaced on scan, restored on calls after patch
    let calls = 0
    getAccountsForNetwork.mockImplementation(async () => {
      calls += 1
      if (calls <= 2) return { accounts: [displaced], activeAccountId: '1' }
      return { accounts: [restored], activeAccountId: '1' }
    })

    const result = await repairDisplacedPasskeySmartAccountAddresses()

    expect(patchAccountSmartAccountAddress).toHaveBeenCalledWith({
      network: 'testnet',
      accountId: '1',
      smartAccountAddress: 'CCMC7L43YL4AVKNWWQJGY6PD2ZL6N2KKGVVWZ7GMLNZM2NYB7YMLY7ET',
    })
    expect(patchAccountSmartAccountAddress).toHaveBeenCalledWith({
      network: 'mainnet',
      accountId: '1',
      smartAccountAddress: 'CCMC7L43YL4AVKNWWQJGY6PD2ZL6N2KKGVVWZ7GMLNZM2NYB7YMLY7ET',
    })
    expect(result.repairedCount).toBe(2)
    expect(result.accounts[0]!.smartAccountAddress).toBe(
      'CCMC7L43YL4AVKNWWQJGY6PD2ZL6N2KKGVVWZ7GMLNZM2NYB7YMLY7ET'
    )
  })
})
