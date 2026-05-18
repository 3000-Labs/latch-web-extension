import { fetchSmartAccountPayments } from '@latch/stellar'

import type { GetSmartAccountTransactionsResponse, SmartAccountTransactionRow } from '@latch/types'

import { getStellarNetworkFromEnv, horizonUrlFromEnv, networkPassphraseFromEnv, sorobanRpcUrlFromEnv } from './migration/env'
import { getAccounts } from './storage'
import { computeBalanceUsd } from './tokenPrices'

function classifyKind(
  tx: { from: string; to: string },
  cAddress: string,
  gAddress?: string,
): SmartAccountTransactionRow['kind'] {
  if (tx.to === cAddress && gAddress && tx.from === gAddress) return 'deposit'
  if (tx.from === cAddress) return 'sent'
  if (tx.to === cAddress) return 'received'
  return 'received'
}

export async function runGetSmartAccountTransactions(
  accountId: string,
): Promise<GetSmartAccountTransactionsResponse> {
  const { accounts } = await getAccounts()
  const acc = accounts.find((a) => a.id === accountId)
  const c = acc?.smartAccountAddress?.trim()
  if (!c) return { items: [] }

  const g = acc?.gAddress?.trim()
  const payments = await fetchSmartAccountPayments({
    cAddress: c,
    gAddress: g,
    horizonUrl: horizonUrlFromEnv(),
    rpcUrl: sorobanRpcUrlFromEnv(),
    networkPassphrase: networkPassphraseFromEnv(),
  })

  const items: SmartAccountTransactionRow[] = payments.map((p) => {
    const code = p.assetCode ?? (p.assetType === 'native' ? 'XLM' : 'ASSET')
    const kind = classifyKind(p, c, g)
    const isSent = p.from === c
    const sign = isSent ? '-' : '+'
    const amountNum = parseFloat(p.amount)
    const amountLabel = Number.isFinite(amountNum)
      ? `${sign}${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })} ${code}`
      : `${sign}${p.amount} ${code}`
    const usd = computeBalanceUsd(p.amount.replace(/^-/, ''), code)
    const amountUsd = usd != null ? `${isSent ? '-' : '+'}$${usd}` : null

    return {
      id: p.id,
      transactionHash: p.transactionHash,
      createdAt: p.createdAt,
      direction: isSent ? 'sent' : 'received',
      assetCode: code,
      amount: p.amount,
      amountLabel,
      amountUsd,
      status: 'completed',
      kind,
      from: p.from,
      to: p.to,
    }
  })

  return { items }
}
