import {
  Address,
  Asset,
  Contract,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk'

import type { PreparedSignOperation } from '@latch/types'

import { CURATED_PORTFOLIO_ASSETS } from './curatedAssets'

export interface LocalReview {
  operations: PreparedSignOperation[]
  /** Invoke contract id(s) extracted from the unsigned XDR (C-addresses). */
  invokeContractIds: string[]
  /** True when the XDR parsed successfully. */
  parsed: boolean
  /** Human-readable parse error when parsed is false. */
  parseError?: string
}

const SAC_TRANSFER_FN = 'transfer'

function truncateAddress(address: string, left = 6, right = 4): string {
  if (address.length <= left + right + 3) return address
  return `${address.slice(0, left)}...${address.slice(-right)}`
}

function scValToString(scv: xdr.ScVal): string {
  try {
    const native = scValToNative(scv)
    if (typeof native === 'string') return native
    if (typeof native === 'bigint') return native.toString()
    if (typeof native === 'number') return String(native)
    if (typeof native === 'boolean') return String(native)
    return JSON.stringify(native)
  } catch {
    return ''
  }
}

function sacSymbolForContractId(contractId: string, networkPassphrase: string): string | undefined {
  const network = networkPassphrase.includes('Test') ? 'testnet' : 'mainnet'
  const assets = CURATED_PORTFOLIO_ASSETS[network] ?? []
  for (const asset of assets) {
    try {
      if (asset.issuer) {
        const sacId = new Asset(asset.code, asset.issuer).contractId(networkPassphrase)
        if (sacId === contractId) return asset.code
      }
    } catch {
      // ignore
    }
  }
  try {
    if (Asset.native().contractId(networkPassphrase) === contractId) return 'XLM'
  } catch {
    // ignore
  }
  return undefined
}

function parseInvokeHostFunction(
  op: xdr.Operation,
  networkPassphrase: string
): PreparedSignOperation | null {
  const invoke = op.body().invokeHostFunctionOp()
  if (!invoke) return null

  const hostFn = invoke.hostFunction()
  const fnName = hostFn.functionName().toString()
  const contractId = hostFn.contractId().toString()

  // SAC transfer(from, to, amount)
  if (fnName === SAC_TRANSFER_FN) {
    const args = hostFn.args()
    if (args.length >= 3) {
      const from = scValToString(args[0])
      const to = scValToString(args[1])
      const amountRaw = scValToString(args[2])
      const symbol = sacSymbolForContractId(contractId, networkPassphrase)
      const amountLabel = symbol ? `${amountRaw} ${symbol}` : amountRaw
      return {
        type: 'sac_transfer',
        summary: `Transfer ${amountLabel} to ${truncateAddress(to)}`,
        details: {
          contract: contractId,
          from,
          to,
          amount: amountRaw,
          ...(symbol ? { symbol } : {}),
        },
      }
    }
  }

  // Generic invoke
  return {
    type: 'invoke_host_function',
    summary: `Call ${truncateAddress(contractId)}::${fnName}`,
    details: {
      contract: contractId,
      function: fnName,
    },
  }
}

/**
 * Decode an unsigned transaction XDR for review purposes (no signing).
 * Returns structured rows compatible with PreparedSignOperation plus the
 * invoke contract id(s) used for consistency checks against prepared.txXdr.
 */
export function parseUnsignedTxForReview(
  unsignedTxXdr: string,
  networkPassphrase: string
): LocalReview {
  try {
    const tx = TransactionBuilder.fromXDR(unsignedTxXdr, networkPassphrase)
    const operations: PreparedSignOperation[] = []
    const invokeContractIds: string[] = []

    for (const op of tx.operations) {
      const parsed = parseInvokeHostFunction(op, networkPassphrase)
      if (parsed) {
        operations.push(parsed)
        const contractId = parsed.details?.contract
        if (contractId && !invokeContractIds.includes(contractId)) {
          invokeContractIds.push(contractId)
        }
      } else {
        // Fallback row for unrecognized ops
        operations.push({
          type: 'contract_interaction',
          summary: 'Contract interaction',
          details: {},
        })
      }
    }

    return { operations, invokeContractIds, parsed: true }
  } catch (e) {
    return {
      operations: [],
      invokeContractIds: [],
      parsed: false,
      parseError: e instanceof Error ? e.message : String(e),
    }
  }
}

/**
 * Extract invoke contract id(s) from a prepared tx XDR (auth attached).
 * Used to cross-check against the dApp's unsigned XDR.
 */
export function extractInvokeContractIds(
  txXdr: string,
  networkPassphrase: string
): string[] {
  try {
    const tx = TransactionBuilder.fromXDR(txXdr, networkPassphrase)
    const ids: string[] = []
    for (const op of tx.operations) {
      const invoke = op.body().invokeHostFunctionOp()
      if (!invoke) continue
      const id = invoke.hostFunction().contractId().toString()
      if (!ids.includes(id)) ids.push(id)
    }
    return ids
  } catch {
    return []
  }
}
