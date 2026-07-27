import { Address, xdr } from '@stellar/stellar-sdk'

/** True when `contractId` has a persistent contract instance on the given Soroban RPC. */
export async function isContractInstanceDeployed(
  rpcUrl: string,
  contractId: string,
  signal?: AbortSignal
): Promise<boolean> {
  const id = contractId.trim()
  if (!id) return false

  const key = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: Address.fromString(id).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    })
  )

  const res = await fetch(rpcUrl.replace(/\/$/, ''), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getLedgerEntries',
      params: { keys: [key.toXDR('base64')] },
    }),
    signal,
  })
  if (!res.ok) throw new Error(`Soroban getLedgerEntries HTTP ${res.status}`)
  const json: unknown = await res.json()
  const o = json as { result?: { entries?: unknown[] }; error?: { message?: string } }
  if (o.error?.message) throw new Error(o.error.message)
  return (o.result?.entries?.length ?? 0) > 0
}
