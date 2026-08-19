import {
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  rpc,
  scValToNative,
  StrKey,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk'

import { applySlippageMin } from '../amounts'
import { SOROSWAP_CONFIG } from '../constants'
import type { SoroswapBuildPayload, SwapNetwork } from '../types'
import {
  parseSoroswapDistribution,
  poolHashToBytes,
  soroswapProtocolIdToU32,
  type SoroswapDistributionEntry,
} from './soroswapQuote'

function contractAddressScVal(contractId: string) {
  return Address.contract(StrKey.decodeContract(contractId)).toScVal()
}

function poolHashesToScVal(poolHashes?: string[]): xdr.ScVal {
  // Option<Vec<BytesN<32>>>: None → void; Some(vec) → scvVec of scvBytes.
  if (!poolHashes || poolHashes.length === 0) {
    return nativeToScVal(null)
  }
  const scVec = poolHashes.map((hash) => {
    const buf = poolHashToBytes(hash)
    if (buf.length !== 32) {
      throw new Error(`Expected 32-byte pool hash, got ${buf.length}`)
    }
    return xdr.ScVal.scvBytes(buf)
  })
  return xdr.ScVal.scvVec(scVec)
}

/**
 * Encode one DexDistribution map. Keys sorted: bytes, parts, path, protocol_id
 * (Soroban map canonical order).
 */
export function dexDistributionEntryToScVal(entry: SoroswapDistributionEntry): xdr.ScVal {
  const protocolU32 = soroswapProtocolIdToU32(entry.protocolId)
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('bytes'),
      val: poolHashesToScVal(entry.poolHashes),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('parts'),
      val: nativeToScVal(entry.parts, { type: 'u32' }),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('path'),
      val: nativeToScVal(
        entry.path.map((addr) => {
          if (!addr.startsWith('C')) {
            throw new Error(`Soroswap path entry must be a contract C-address: ${addr}`)
          }
          return Address.contract(StrKey.decodeContract(addr))
        })
      ),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('protocol_id'),
      val: nativeToScVal(protocolU32, { type: 'u32' }),
    }),
  ])
}

export function buildDexDistributionScVal(entries: SoroswapDistributionEntry[]): xdr.ScVal {
  return xdr.ScVal.scvVec(entries.map(dexDistributionEntryToScVal))
}

/** Aggregator `swap_exact_tokens_for_tokens` returns Vec<Vec<i128>>; sum last hop of each route. */
export function extractAggregatorAmountOut(retval: xdr.ScVal): bigint {
  const native = scValToNative(retval) as unknown
  if (!Array.isArray(native) || native.length === 0) {
    throw new Error('Soroswap simulation returned an empty swap result')
  }

  let total = 0n
  for (const route of native) {
    if (!Array.isArray(route) || route.length === 0) {
      throw new Error('Soroswap simulation returned an invalid route result')
    }
    const last = route[route.length - 1]
    const asBig =
      typeof last === 'bigint'
        ? last
        : typeof last === 'number'
          ? BigInt(last)
          : typeof last === 'string'
            ? BigInt(last)
            : null
    if (asBig === null || asBig < 0n) {
      throw new Error('Soroswap simulation returned a non-integer amountOut')
    }
    total += asBig
  }
  if (total <= 0n) {
    throw new Error('Soroswap simulation returned zero amountOut')
  }
  return total
}

function formatAggregatorSimError(error: string): string {
  if (error.includes('#608') || error.includes('InsufficientOutputAmount')) {
    return 'Swap would fail on-chain: output below minimum (price moved or quote was stale). Try again.'
  }
  if (error.includes('#505') || error.includes('DeadlineExpired')) {
    return 'Swap quote expired before prepare. Try again.'
  }
  if (error.includes('#406') || error.includes('MissingPoolHashes')) {
    return 'Soroswap aqua route is missing pool hashes.'
  }
  if (error.includes('#610') || error.includes('ProtocolPaused')) {
    return 'Soroswap reports this DEX protocol is paused.'
  }
  const host = error.match(/HostError:[^\n]+/)?.[0]
  return host ? `Soroswap simulation failed: ${host}` : `Soroswap simulation failed: ${error.slice(0, 240)}`
}

function buildAggregatorTx(args: {
  sourceAccount: Awaited<ReturnType<rpc.Server['getAccount']>>
  networkPassphrase: string
  aggregatorId: string
  tokenInContractId: string
  tokenOutContractId: string
  amountInRaw: string
  amountOutMinRaw: string
  distributionScVal: xdr.ScVal
  smartAccountAddress: string
  deadlineSec: number
}) {
  const aggregator = new Contract(args.aggregatorId)
  return new TransactionBuilder(args.sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: args.networkPassphrase,
  })
    .addOperation(
      aggregator.call(
        'swap_exact_tokens_for_tokens',
        contractAddressScVal(args.tokenInContractId),
        contractAddressScVal(args.tokenOutContractId),
        nativeToScVal(BigInt(args.amountInRaw), { type: 'i128' }),
        nativeToScVal(BigInt(args.amountOutMinRaw), { type: 'i128' }),
        args.distributionScVal,
        contractAddressScVal(args.smartAccountAddress),
        nativeToScVal(args.deadlineSec, { type: 'u64' })
      )
    )
    .setTimeout(300)
    .build()
}

/**
 * Build unsigned aggregator invoke XDR for Latch prepare-sign.
 *
 * Soroswap `/quote` amountOut can disagree with on-chain aggregator execution (observed
 * InsufficientOutputAmount #608 on prepare-sign). We probe-simulate with amountOutMin=0,
 * read the real output, then rebuild with a slippage-adjusted minimum before returning XDR.
 */
export async function buildSoroswapAggregatorUnsignedTx(args: {
  network: SwapNetwork
  smartAccountAddress: string
  transactionSourceG: string
  buildPayload: SoroswapBuildPayload
  amountInRaw: string
  amountOutMinRaw: string
  tokenInContractId: string
  tokenOutContractId: string
  rpcUrl: string
  networkPassphrase: string
  slippageBps: number
  /** Unix seconds; defaults to now + 10 minutes. */
  deadlineSec?: number
}): Promise<string> {
  const {
    network,
    smartAccountAddress,
    transactionSourceG,
    buildPayload,
    amountInRaw,
    amountOutMinRaw,
    tokenInContractId,
    tokenOutContractId,
    rpcUrl,
    networkPassphrase,
    slippageBps,
  } = args

  if (!transactionSourceG.startsWith('G')) {
    throw new Error('Swap transaction source must be a Stellar G-address (fee payer / bundler).')
  }
  if (!smartAccountAddress.startsWith('C')) {
    throw new Error('Smart account address must be a contract C-address.')
  }
  if (buildPayload.kind !== 'soroswap') {
    throw new Error('Invalid build payload for Soroswap aggregator build')
  }

  const aggregatorId =
    buildPayload.routerContractId?.startsWith('C')
      ? buildPayload.routerContractId
      : SOROSWAP_CONFIG[network].routerContractId

  const distribution = parseSoroswapDistribution(buildPayload.quote)
  const distributionScVal = buildDexDistributionScVal(distribution)
  const deadline = args.deadlineSec ?? Math.floor(Date.now() / 1000) + 600

  const server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http:') })
  let sourceAccount
  try {
    sourceAccount = await server.getAccount(transactionSourceG)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Could not load swap fee-payer account ${transactionSourceG} from RPC (${rpcUrl}). ` +
        `Confirm PLASMO_PUBLIC_LATCH_FEE_PAYER_G_MAINNET matches the Latch bundler public G on this network. ${detail}`
    )
  }

  const common = {
    sourceAccount,
    networkPassphrase,
    aggregatorId,
    tokenInContractId,
    tokenOutContractId,
    amountInRaw,
    distributionScVal,
    smartAccountAddress,
    deadlineSec: deadline,
  }

  // Probe with min=0 so simulation reports the real on-chain output (not quote API amountOut).
  const probeTx = buildAggregatorTx({ ...common, amountOutMinRaw: '0' })
  const probeSim = await server.simulateTransaction(probeTx)
  if (rpc.Api.isSimulationError(probeSim)) {
    throw new Error(formatAggregatorSimError(probeSim.error))
  }
  if (!rpc.Api.isSimulationSuccess(probeSim) || !probeSim.result?.retval) {
    throw new Error('Soroswap probe simulation did not return a result')
  }

  const simulatedOut = extractAggregatorAmountOut(probeSim.result.retval)
  const calibratedMin = applySlippageMin(simulatedOut.toString(), slippageBps)

  // Prefer the stricter (lower) of quote min vs on-chain calibrated min.
  let quoteMin = 0n
  try {
    quoteMin = BigInt(amountOutMinRaw)
  } catch {
    quoteMin = 0n
  }
  const calibrated = BigInt(calibratedMin)
  const amountOutMinFinal =
    quoteMin > 0n && quoteMin < calibrated ? quoteMin.toString() : calibrated.toString()

  const finalTx = buildAggregatorTx({ ...common, amountOutMinRaw: amountOutMinFinal })
  return finalTx.toXDR()
}
