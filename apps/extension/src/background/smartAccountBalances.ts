import type { GetSmartAccountBalancesResponse } from '@latch/types'

import { fetchSmartAccountBalancesForAccount } from './smartAccountBalancesApi'
import { getAccounts } from './storage'

export async function runGetSmartAccountBalances(accountId: string): Promise<GetSmartAccountBalancesResponse> {
  const { accounts } = await getAccounts()
  const acc = accounts.find((a) => a.id === accountId)
  const c = acc?.smartAccountAddress?.trim()
  if (!c) {
    return { rows: [] }
  }

  return fetchSmartAccountBalancesForAccount(c, { all: false })
}
