import { loadSmartAccountPortfolioRows } from '@latch/stellar'

import type { GetSmartAccountBalancesResponse, SmartAccountBalanceRow } from '@latch/types'

import { resolveIconDataUrlForClassicAsset } from './assetIcons'
import { getStellarNetworkFromEnv, horizonUrlFromEnv, networkPassphraseFromEnv, sorobanRpcUrlFromEnv } from './migration/env'
import { getAccounts } from './storage'

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
      row.issuer
        ? resolveIconDataUrlForClassicAsset({
            network,
            horizonUrl,
            code: row.code,
            issuer: row.issuer,
          })
        : Promise.resolve(null),
    ),
  )

  const rows: SmartAccountBalanceRow[] = core.map((row, i) => ({
    code: row.code,
    issuer: row.issuer,
    sacContractId: row.sacContractId,
    amount: row.amount,
    iconUrl: iconResults[i] ?? null,
  }))

  return { rows }
}
