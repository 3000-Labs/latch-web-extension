import { Address, scValToNative, xdr } from '@stellar/stellar-sdk'

/** Default Stellar issued-asset / native display scale on Horizon and SAC for most assets. */
export const STELLAR_SAC_DISPLAY_DECIMALS = 7

function ledgerKeyContractDataBase64(sacContractId: string, cAddress: string): string {
  const key = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: new Address(sacContractId).toScAddress(),
      key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Balance'), new Address(cAddress).toScVal()]),
      durability: xdr.ContractDataDurability.persistent(),
    }),
  )
  return key.toXDR('base64')
}

export async function fetchSacBalanceRaw(
  rpcUrl: string,
  cAddress: string,
  sacContractId: string,
  signal?: AbortSignal,
): Promise<bigint> {
  const keyB64 = ledgerKeyContractDataBase64(sacContractId, cAddress)
  const res = await fetch(rpcUrl.replace(/\/$/, ''), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getLedgerEntries',
      params: { keys: [keyB64] },
    }),
    signal,
  })
  if (!res.ok) throw new Error(`Soroban getLedgerEntries HTTP ${res.status}`)
  const json: unknown = await res.json()
  const o = json as { result?: { entries?: { xdr?: string }[] }; error?: { message?: string } }
  if (o.error?.message) throw new Error(o.error.message)
  const entries = o.result?.entries ?? []
  if (entries.length === 0) return 0n
  const entryXdr = entries[0]?.xdr
  if (!entryXdr) return 0n
  const entryData = xdr.LedgerEntryData.fromXDR(entryXdr, 'base64')
  const val = entryData.contractData().val()
  const native = scValToNative(val)
  if (typeof native === 'bigint') return native >= 0n ? native : 0n
  if (native && typeof native === 'object' && 'amount' in native) {
    const amt = (native as { amount?: unknown }).amount
    if (typeof amt === 'bigint') return amt >= 0n ? amt : 0n
  }
  return 0n
}

export function formatSacRawToHuman(amount: bigint, decimals = STELLAR_SAC_DISPLAY_DECIMALS): string {
  const neg = amount < 0n
  const a = neg ? -amount : amount
  const d = BigInt(10) ** BigInt(decimals)
  const intPart = a / d
  const frac = a % d
  if (frac === 0n) return `${neg ? '-' : ''}${intPart.toString()}`
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${neg ? '-' : ''}${intPart.toString()}.${fracStr}`
}
