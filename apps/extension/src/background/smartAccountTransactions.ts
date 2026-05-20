import { fetchSmartAccountPayments, stellarAddressEquals } from '@latch/stellar'

import type { GetSmartAccountTransactionsResponse, SmartAccountTransactionRow } from '@latch/types'

import {
  horizonUrlFromEnv,
  networkPassphraseFromEnv,
  sorobanRpcUrlFromEnv,
} from './migration/env'
import { getAccounts } from './storage'
import { getMarketPrices } from './marketPrices'
import { computeBalanceUsd } from './tokenPrices'

function classifyKind(
  tx: { from: string; to: string },
  cAddress: string,
  gAddress?: string
): SmartAccountTransactionRow['kind'] {
  if (
    stellarAddressEquals(tx.to, cAddress) &&
    gAddress &&
    stellarAddressEquals(tx.from, gAddress)
  ) {
    return 'deposit'
  }
  if (stellarAddressEquals(tx.from, cAddress)) return 'sent'
  if (stellarAddressEquals(tx.to, cAddress)) return 'received'
  return 'received'
}

export async function runGetSmartAccountTransactions(
  accountId: string
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

  const codes = payments.map((p) => p.assetCode ?? (p.assetType === 'native' ? 'XLM' : 'ASSET'))
  const { pricesByCodeUpper } = await getMarketPrices(codes)

  const items: SmartAccountTransactionRow[] = payments.map((p) => {
    const code = p.assetCode ?? (p.assetType === 'native' ? 'XLM' : 'ASSET')
    const kind = classifyKind(p, c, g)
    const isSent = stellarAddressEquals(p.from, c)
    const sign = isSent ? '-' : '+'
    const amountNum = parseFloat(p.amount)
    const amountLabel = Number.isFinite(amountNum)
      ? `${sign}${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`
      : `${sign}${p.amount} ${code}`
    const priceUsd = pricesByCodeUpper[code.toUpperCase()]?.priceUsd
    const usd = computeBalanceUsd(p.amount.replace(/^-/, ''), priceUsd)
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
