import { Horizon, Transaction } from '@stellar/stellar-sdk'

export function createHorizonServer(horizonUrl: string): Horizon.Server {
  return new Horizon.Server(horizonUrl, { allowHttp: horizonUrl.startsWith('http:') })
}

export async function submitClassicTransaction(
  horizonUrl: string,
  signed: Transaction
): Promise<{ hash: string }> {
  const server = createHorizonServer(horizonUrl)
  const res = await server.submitTransaction(signed)
  return { hash: res.hash }
}

export async function pollHorizonTransaction(
  horizonUrl: string,
  hash: string,
  options?: { pollIntervalMs?: number; maxAttempts?: number }
): Promise<{ status: 'success' | 'failed' | 'pending'; ledgerAttr?: number }> {
  const server = createHorizonServer(horizonUrl)
  const pollIntervalMs = options?.pollIntervalMs ?? 1000
  const maxAttempts = options?.maxAttempts ?? 45

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const tx = await server.transactions().transaction(hash).call()
      if (tx.successful) {
        const ledger = typeof tx.ledger === 'number' ? tx.ledger : undefined
        return { status: 'success', ledgerAttr: ledger }
      }
      return { status: 'failed' }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('404') || msg.includes('Not Found')) {
        await new Promise((r) => setTimeout(r, pollIntervalMs))
        continue
      }
      return { status: 'failed' }
    }
  }
  return { status: 'pending' }
}
