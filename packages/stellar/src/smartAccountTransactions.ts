import { Address, Asset, scValToNative, xdr } from '@stellar/stellar-sdk'

export interface SmartAccountPayment {
  id: string
  transactionHash: string
  type: string
  from: string
  to: string
  amount: string
  assetType: string
  assetCode?: string
  createdAt: string
}

async function horizonGet(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!res.ok) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function sorobanRpc(rpcUrl: string, method: string, params: object, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal,
  })
  try {
    return await res.json()
  } catch {
    return {}
  }
}

function scValB64(val: xdr.ScVal): string {
  const bytes = new Uint8Array(val.toXDR())
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!)
  return btoa(s)
}

async function fetchGAddressHistory(
  horizonUrl: string,
  gAddress: string,
  cAddress: string,
  signal?: AbortSignal,
): Promise<SmartAccountPayment[]> {
  const resp = (await horizonGet(
    `${horizonUrl.replace(/\/$/, '')}/accounts/${encodeURIComponent(gAddress)}/operations?limit=50&order=desc`,
    signal,
  )) as { _embedded?: { records?: unknown[] } } | null

  const allOps = (resp?._embedded?.records ?? []) as Record<string, unknown>[]
  const invokeOps = allOps.filter((r) => r.type === 'invoke_host_function')
  if (invokeOps.length === 0) return []

  const effectsBatch = await Promise.all(
    invokeOps.map((op) =>
      horizonGet(
        `${horizonUrl.replace(/\/$/, '')}/operations/${String(op.id)}/effects`,
        signal,
      ).then((r) => (r as { _embedded?: { records?: unknown[] } } | null)?._embedded?.records ?? []),
    ),
  )

  const results: SmartAccountPayment[] = []
  for (let i = 0; i < invokeOps.length; i++) {
    const op = invokeOps[i]!
    const effects = effectsBatch[i] as Record<string, unknown>[]

    const matchesCAddress = (e: Record<string, unknown>) =>
      e.account === cAddress || e.contract === cAddress
    const creditEffect = effects.find((e) => e.type === 'contract_credited' && matchesCAddress(e))
    const debitEffect = effects.find((e) => e.type === 'contract_debited' && matchesCAddress(e))
    if (!creditEffect && !debitEffect) continue

    const isIncoming = !!creditEffect
    const effect = (creditEffect ?? debitEffect)!

    results.push({
      id: String(op.id),
      transactionHash: String(op.transaction_hash ?? ''),
      type: 'invoke_host_function',
      from: isIncoming ? String(op.source_account) : cAddress,
      to: isIncoming ? cAddress : String(op.source_account),
      amount: String(effect.amount ?? '0'),
      assetType: effect.asset_type === 'native' ? 'native' : 'credit_alphanum4',
      assetCode: typeof effect.asset_code === 'string' ? effect.asset_code : undefined,
      createdAt: String(op.created_at ?? ''),
    })
  }

  return results
}

async function fetchSacTransferEvents(
  rpcUrl: string,
  networkPassphrase: string,
  cAddress: string,
  signal?: AbortSignal,
): Promise<SmartAccountPayment[]> {
  const nativeSacId = Asset.native().contractId(networkPassphrase)

  const latestLedgerResp = (await sorobanRpc(rpcUrl, 'getLatestLedger', {}, signal)) as {
    result?: { sequence?: number }
    error?: unknown
  }
  const latestLedger = latestLedgerResp?.result?.sequence ?? 0
  if (latestLedger === 0) return []

  const startLedger = latestLedger - 17_000
  const transferSym = scValB64(xdr.ScVal.scvSymbol('transfer'))
  const cAddressVal = scValB64(new Address(cAddress).toScVal())
  const wildcard = '*'

  const makeFilter = (sender: string, recipient: string, start: number) => ({
    startLedger: start,
    filters: [
      {
        type: 'contract',
        contractIds: [nativeSacId],
        topics: [[transferSym], [sender], [recipient], [wildcard]],
      },
    ],
    pagination: { limit: 50 },
  })

  let incomingResp = (await sorobanRpc(
    rpcUrl,
    'getEvents',
    makeFilter(wildcard, cAddressVal, startLedger),
    signal,
  )) as { result?: { events?: unknown[] }; error?: unknown }
  let outgoingResp = (await sorobanRpc(
    rpcUrl,
    'getEvents',
    makeFilter(cAddressVal, wildcard, startLedger),
    signal,
  )) as { result?: { events?: unknown[] }; error?: unknown }

  if (incomingResp?.error || outgoingResp?.error) {
    const fallbackStart = latestLedger - 4_320
    incomingResp = (await sorobanRpc(
      rpcUrl,
      'getEvents',
      makeFilter(wildcard, cAddressVal, fallbackStart),
      signal,
    )) as typeof incomingResp
    outgoingResp = (await sorobanRpc(
      rpcUrl,
      'getEvents',
      makeFilter(cAddressVal, wildcard, fallbackStart),
      signal,
    )) as typeof outgoingResp
  }

  const mapEvent = (event: Record<string, unknown>): SmartAccountPayment | null => {
    try {
      const topics = (event.topic ?? []) as string[]
      const from = String(scValToNative(xdr.ScVal.fromXDR(topics[1]!, 'base64')))
      const to = String(scValToNative(xdr.ScVal.fromXDR(topics[2]!, 'base64')))
      const amountRaw = scValToNative(xdr.ScVal.fromXDR(String(event.value), 'base64')) as bigint
      return {
        id: String(event.id ?? event.txHash ?? ''),
        transactionHash: String(event.txHash ?? ''),
        type: 'invoke_host_function',
        from,
        to,
        amount: (Number(amountRaw) / 10_000_000).toFixed(7),
        assetType: 'native',
        assetCode: 'XLM',
        createdAt: String(event.ledgerClosedAt ?? ''),
      }
    } catch {
      return null
    }
  }

  const incoming = ((incomingResp?.result?.events ?? []) as Record<string, unknown>[])
    .map(mapEvent)
    .filter(Boolean) as SmartAccountPayment[]
  const outgoing = ((outgoingResp?.result?.events ?? []) as Record<string, unknown>[])
    .map(mapEvent)
    .filter(Boolean) as SmartAccountPayment[]

  const seen = new Set<string>()
  return [...incoming, ...outgoing].filter((tx) => {
    if (!tx.transactionHash || seen.has(tx.transactionHash)) return false
    seen.add(tx.transactionHash)
    return true
  })
}

export async function fetchSmartAccountPayments(params: {
  cAddress: string
  gAddress?: string | null
  horizonUrl: string
  rpcUrl: string
  networkPassphrase: string
  signal?: AbortSignal
}): Promise<SmartAccountPayment[]> {
  const [gAddrResult, sacResult] = await Promise.allSettled([
    params.gAddress
      ? fetchGAddressHistory(params.horizonUrl, params.gAddress, params.cAddress, params.signal)
      : Promise.resolve([]),
    fetchSacTransferEvents(params.rpcUrl, params.networkPassphrase, params.cAddress, params.signal),
  ])

  const horizonTxs = gAddrResult.status === 'fulfilled' ? gAddrResult.value : []
  const sacEvents = sacResult.status === 'fulfilled' ? sacResult.value : []

  const seen = new Set<string>()
  const merged = [...sacEvents, ...horizonTxs].filter((tx) => {
    if (!tx.transactionHash || seen.has(tx.transactionHash)) return false
    seen.add(tx.transactionHash)
    return true
  })

  return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
