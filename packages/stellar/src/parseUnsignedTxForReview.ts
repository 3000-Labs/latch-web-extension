/**
 * Local (wallet-side) decode of an unsigned transaction XDR for review.
 * This is NOT signing — it only parses protocol bytes so the review UI is
 * not owned by the Latch API's prepare-sign summary. See AGENTS.md.
 */

import { TransactionBuilder, xdr } from '@stellar/stellar-sdk'

import type { Network } from '@latch/types'

import { networkPassphraseFor } from './networkPassphrase'

export interface LocalReviewOperation {
  type: string
  summary: string
  details?: Record<string, string>
}

export interface LocalReviewResult {
  ok: boolean
  /** Human-readable ops derived from the unsigned XDR. */
  operations: LocalReviewOperation[]
  /** Invoke contract ids (C…) found in the envelope. */
  invokeContractIds: string[]
  /** True when the XDR parsed but contained no recognized invoke ops. */
  hasUnrecognizedOps: boolean
  error?: string
}

const SAC_TRANSFER_FN = 'transfer'

function truncateAddress(address: string, left = 6, right = 4): string {
  if (address.length <= left + right + 3) return address
  return `${address.slice(0, left)}...${address.slice(-right)}`
}

function scValToString(scVal: xdr.ScVal): string | null {
  try {
    switch (scVal.switch()) {
      case xdr.ScValType.scvString():
        return scVal.str()?.toString() ?? null
      case xdr.ScValType.scvSymbol():
        return scVal.sym()?.toString() ?? null
      case xdr.ScValType.scvU32():
        return String(scVal.u32())
      case xdr.ScValType.scvI32():
        return String(scVal.i32())
      case xdr.ScValType.scvU64():
        return scVal.u64()?.toString() ?? null
      case xdr.ScValType.scvI64():
        return scVal.i64()?.toString() ?? null
      case xdr.ScValType.scvU128():
        return scVal.u128()?.toString() ?? null
      case xdr.ScValType.scvI128():
        return scVal.i128()?.toString() ?? null
      case xdr.ScValType.scvU256():
        return scVal.u256()?.toString() ?? null
      case xdr.ScValType.scvI256():
        return scVal.i256()?.toString() ?? null
      case xdr.ScValType.scvBool():
        return String(scVal.b())
      case xdr.ScValType.scvAddress():
        return scVal.address()?.toString() ?? null
      default:
        return null
    }
  } catch {
    return null
  }
}

function contractIdFromScAddress(address: xdr.ScAddress): string | null {
  try {
    if (address.switch() === xdr.ScAddressType.scAddressTypeContract()) {
      return address.contractId()?.toString('hex') ?? null
    }
  } catch {
    // fall through
  }
  return null
}

function contractIdFromInvokeHostFunction(
  invoke: xdr.InvokeHostFunctionOp
): { contractId: string | null; fnName: string | null } {
  try {
    const hostFn = invoke.hostFunction()
    if (hostFn.switch() !== xdr.HostFunctionType.hostFunctionTypeInvokeContract()) {
      return { contractId: null, fnName: null }
    }
    const contractFn = hostFn.invokeContract()
    const contractId = contractIdFromScAddress(contractFn.contractAddress())
    const fnName = contractFn.functionName()?.toString() ?? null
    return { contractId, fnName }
  } catch {
    return { contractId: null, fnName: null }
  }
}

function decodeSacTransferArgs(
  invoke: xdr.InvokeHostFunctionOp
): { from: string | null; to: string | null; amount: string | null } | null {
  try {
    const hostFn = invoke.hostFunction()
    if (hostFn.switch() !== xdr.HostFunctionType.hostFunctionTypeInvokeContract()) return null
    const contractFn = hostFn.invokeContract()
    const fnName = contractFn.functionName()?.toString() ?? ''
    if (fnName !== SAC_TRANSFER_FN) return null
    const args = contractFn.args() ?? []
    if (args.length < 3) return null
    const from = scValToString(args[0])
    const to = scValToString(args[1])
    const amount = scValToString(args[2])
    return { from, to, amount }
  } catch {
    return null
  }
}

/**
 * Parse an unsigned transaction XDR and produce review rows + extracted
 * invoke contract ids. Returns ok:false (with error) when the XDR cannot be
 * parsed at all — callers must hard-block Confirm in that case.
 */
export function parseUnsignedTxForReview(
  unsignedTxXdr: string,
  network: Network
): LocalReviewResult {
  const operations: LocalReviewOperation[] = []
  const invokeContractIds: string[] = []
  let hasUnrecognizedOps = false

  let tx
  try {
    tx = TransactionBuilder.fromXDR(unsignedTxXdr, networkPassphraseFor(network))
  } catch (err) {
    return {
      ok: false,
      operations: [],
      invokeContractIds: [],
      hasUnrecognizedOps: false,
      error: err instanceof Error ? err.message : 'Unable to parse transaction XDR',
    }
  }

  for (const op of tx.operations) {
    const invoke = op.invokeHostFunction()
    if (!invoke) {
      hasUnrecognizedOps = true
      operations.push({
        type: 'contract-interaction',
        summary: 'Contract interaction',
        details: { operation: op.type },
      })
      continue
    }

    const { contractId, fnName } = contractIdFromInvokeHostFunction(invoke)
    if (contractId) invokeContractIds.push(contractId)

    const sac = decodeSacTransferArgs(invoke)
    if (sac && sac.to && sac.amount) {
      operations.push({
        type: 'sac-transfer',
        summary: `Transfer ${sac.amount} to ${truncateAddress(sac.to)}`,
        details: {
          ...(sac.from ? { from: sac.from } : {}),
          to: sac.to,
          amount: sac.amount,
          ...(contractId ? { contract: contractId } : {}),
        },
      })
      continue
    }

    if (contractId && fnName) {
      operations.push({
        type: 'invoke-host-function',
        summary: `Call ${truncateAddress(contractId)}::${fnName}`,
        details: {
          contract: contractId,
          function: fnName,
        },
      })
      continue
    }

    hasUnrecognizedOps = true
    operations.push({
      type: 'contract-interaction',
      summary: 'Contract interaction',
      details: {
        ...(contractId ? { contract: contractId } : {}),
        ...(fnName ? { function: fnName } : {}),
      },
    })
  }

  return { ok: true, operations, invokeContractIds, hasUnrecognizedOps }
}
