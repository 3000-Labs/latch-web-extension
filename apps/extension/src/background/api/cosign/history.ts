import type { CosignHistoryTransaction } from '@latch/types'

import { v1FetchForWallet } from '../v1Client'

export async function getWalletHistory(
  wallet: string,
  cAddress: string,
  network: 'testnet' | 'mainnet' = 'testnet',
  limit = 50
): Promise<CosignHistoryTransaction[]> {
  const data = await v1FetchForWallet<{ transactions: CosignHistoryTransaction[] }>(
    wallet,
    `/v1/history?c_address=${encodeURIComponent(cAddress)}&network=${network}&limit=${limit}`,
    { method: 'GET' }
  )
  return data.transactions ?? []
}
