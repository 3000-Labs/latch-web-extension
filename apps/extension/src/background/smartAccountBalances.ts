import { loadSmartAccountPortfolioRows } from '@latch/stellar'

import type { GetSmartAccountBalancesResponse, SmartAccountBalanceRow } from '@latch/types'

import { resolveIconUrlForAsset } from './assetIcons'
import { getStellarNetworkFromEnv, horizonUrlFromEnv, networkPassphraseFromEnv, sorobanRpcUrlFromEnv } from './migration/env'
import { getAccounts } from './storage'
import { computeBalanceUsd, computeTotalBalanceUsd } from './tokenPrices'

export async function runGetSmartAccountBalances(accountId: string): Promise<GetSmartAccountBalancesResponse> {
  const { accounts } = await getAccounts()
  const acc = accounts.find((a) => a.id === accountId)
  const c = acc?.smartAccountAddress?.trim()
  if (!c) {
    return { rows: [] }
  }

  const g = acc?.gAddress?.trim()
  const rpcUrl = sorobanRpcUrlFromEnv()
  const horizonUrl = horizonUrlFromEnv()
  const passphrase = networkPassphraseFromEnv()
  const network = getStellarNetworkFromEnv()

  const core = await loadSmartAccountPortfolioRows({
    rpcUrl,
    networkPassphrase: passphrase,
    cAddress: c,
    gAddress: g,
    horizonUrl,
  })

  const iconResults = await Promise.all(
    core.map((row) =>
      resolveIconUrlForAsset({
        network,
        horizonUrl,
        code: row.code,
        issuer: row.issuer,
        sacContractId: row.sacContractId,
      }),
    ),
  )

  const rows: SmartAccountBalanceRow[] = core.map((row, i) => {
    const balanceUsd = computeBalanceUsd(row.amount, row.code)
    return {
      code: row.code,
      issuer: row.issuer,
      sacContractId: row.sacContractId,
      amount: row.amount,
      iconUrl: iconResults[i] ?? null,
      balanceUsd: balanceUsd ?? undefined,
    }
  })

  const totalBalanceUsd = computeTotalBalanceUsd(rows) ?? undefined

  return { rows, totalBalanceUsd }
}
