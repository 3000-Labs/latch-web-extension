import { rpc, Transaction } from '@stellar/stellar-sdk'

/** Soroban fee used before simulation; often replaced by assembled tx fee. */
export const DEFAULT_SOROBAN_BASE_FEE = '1500000'

export function createRpcServer(rpcUrl: string): rpc.Server {
  return new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http:') })
}

/**
 * Simulates an unsigned Soroban tx and returns the fully built transaction (still unsigned).
 * Caller signs the result, then {@link sendAndPollSoroban}.
 */
export async function simulateAndAssembleSoroban(
  server: rpc.Server,
  transaction: Transaction
): Promise<Transaction> {
  const sim = await server.simulateTransaction(transaction)
  if (rpc.Api.isSimulationError(sim)) {
    const err = sim.error
    const msg =
      typeof err === 'string'
        ? err
        : err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : JSON.stringify(err)
    throw new Error(msg || 'Simulation failed')
  }
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error('Unexpected simulation response')
  }
  const txData = sim.transactionData
  if (txData == null) {
    throw new Error('Token SAC does not exist on this network — cannot transfer this asset.')
  }
  return rpc.assembleTransaction(transaction, sim).build()
}

export async function sendAndPollSoroban(
  server: rpc.Server,
  signed: Transaction,
  options?: { pollIntervalMs?: number; maxAttempts?: number }
): Promise<{
  status: 'SUCCESS' | 'FAILED'
  hash: string
  latestLedger?: number
  error?: string
  confirmationTimedOut?: boolean
}> {
  const pollIntervalMs = options?.pollIntervalMs ?? 1000
  const maxAttempts = options?.maxAttempts ?? 90

  const send = await server.sendTransaction(signed)
  if (send.status === 'ERROR' || send.status === 'TRY_AGAIN_LATER') {
    const err =
      'errorResult' in send && send.errorResult != null ? String(send.errorResult) : send.status
    return {
      status: 'FAILED',
      hash: send.hash,
      error: err,
    }
  }
  const hash = send.hash
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollIntervalMs))
    const got = await server.getTransaction(hash)
    if (got.status === 'SUCCESS') {
      return { status: 'SUCCESS', hash, latestLedger: got.latestLedger }
    }
    if (got.status === 'FAILED') {
      const rx = 'resultXdr' in got && got.resultXdr != null ? String(got.resultXdr) : 'FAILED'
      return {
        status: 'FAILED',
        hash,
        error: rx,
        latestLedger: got.latestLedger,
      }
    }
  }
  return {
    status: 'FAILED',
    hash,
    error: 'Transaction timed out while confirming on ledger.',
    confirmationTimedOut: true,
  }
}
