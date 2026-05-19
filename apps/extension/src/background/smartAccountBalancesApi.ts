import type {
  ApiSmartAccountBalance,
  GetSmartAccountBalancesResponse,
  SmartAccountBalanceRow,
} from '@latch/types'

import { getSmartAccountBalancesFromApi } from './backend'
import { resolveIconUrlForAsset } from './assetIcons'
import { getStellarNetworkFromEnv, horizonUrlFromEnv } from './migration/env'
import { computeBalanceUsd, computeTotalBalanceUsd } from './tokenPrices'

export function mapApiBalanceToRow(
  balance: ApiSmartAccountBalance,
  iconUrl: string | null,
): SmartAccountBalanceRow {
  const balanceUsd = computeBalanceUsd(balance.balance, balance.symbol)
  return {
    code: balance.symbol,
    sacContractId: balance.contractId,
    assetId: balance.assetId,
    decimals: balance.decimals,
    amount: balance.balance,
    iconUrl,
    balanceUsd: balanceUsd ?? undefined,
  }
}

export async function fetchSmartAccountBalancesForAccount(
  smartAccountAddress: string,
  options?: { all?: boolean },
): Promise<GetSmartAccountBalancesResponse> {
  const api = await getSmartAccountBalancesFromApi(smartAccountAddress, options?.all ?? false)
  const network = getStellarNetworkFromEnv()
  const horizonUrl = horizonUrlFromEnv()

  const iconResults = await Promise.all(
    api.balances.map((b) =>
      resolveIconUrlForAsset({
        network,
        horizonUrl,
        code: b.symbol,
        sacContractId: b.contractId,
      }),
    ),
  )

  const rows = api.balances.map((b, i) => mapApiBalanceToRow(b, iconResults[i] ?? null))
  const totalBalanceUsd = computeTotalBalanceUsd(rows) ?? undefined

  return { rows, totalBalanceUsd }
}
