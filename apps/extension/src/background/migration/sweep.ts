import { Account, Asset, Keypair } from '@stellar/stellar-sdk'
import type { MigrationSweepResult } from '@latch/types'
import type { Transaction } from '@stellar/stellar-sdk'

import {
  buildUnsignedSacTransferTx,
  createRpcServer,
  DEFAULT_SOROBAN_BASE_FEE,
  humanAmountStringToRawUnits,
  parseHorizonAccountJson,
  sendAndPollSoroban,
  simulateAndAssembleSoroban,
  stellarMinReserveXlm,
  STELLAR_SAC_DISPLAY_DECIMALS,
} from '@latch/stellar'

import { BackendError } from '../backend'
import { getMnemonicKeypair } from '../mnemonicSession'
import { getAccounts } from '../storage'
import { invalidateDiscoveryCacheForAccount } from './discoveryCache'
import { horizonUrlFromEnv, networkPassphraseFromEnv, sorobanRpcUrlFromEnv } from './env'

const sorobanPollOpts = { pollIntervalMs: 1500, maxAttempts: 90 } as const
/** Keep at least this much XLM on G while further Soroban sweeps may run (per product / fee headroom). */
const MIN_XLM_LINGER_ON_CLASSIC_G = 1.5

function requireMnemonicKeypair(accountId: string): Keypair {
  const kp = getMnemonicKeypair(accountId)
  if (!kp) {
    throw new BackendError(
      'Seed signer is not loaded. Unlock with your saved password or re-import your recovery phrase.',
      { code: 'mnemonic_locked' }
    )
  }
  return kp
}

async function fetchHorizonAccountJson(gAddress: string): Promise<unknown> {
  const horizonUrl = horizonUrlFromEnv()
  const response = await fetch(
    `${horizonUrl.replace(/\/$/, '')}/accounts/${encodeURIComponent(gAddress)}`
  )
  if (!response.ok) {
    throw new Error(`Could not load account: HTTP ${response.status}`)
  }
  return response.json()
}

export async function runMigrationSweepXlm(
  accountId: string,
  pendingTokenSweepCount = 0
): Promise<MigrationSweepResult> {
  const { accounts } = await getAccounts()
  const account = accounts.find((a) => a.id === accountId)
  if (!account?.gAddress || !account.smartAccountAddress) {
    return {
      success: false,
      error: { message: 'Missing G or smart account address', code: 'missing_addresses' },
    }
  }
  if (account.mode !== 'mnemonic') {
    return {
      success: false,
      error: { message: 'Migration requires a mnemonic account.', code: 'not_mnemonic' },
    }
  }

  const keypair = requireMnemonicKeypair(accountId)
  const g = account.gAddress
  const c = account.smartAccountAddress
  const passphrase = networkPassphraseFromEnv()
  const rpcUrl = sorobanRpcUrlFromEnv()

  const json = await fetchHorizonAccountJson(g)
  const record = parseHorizonAccountJson(json)
  if (!record) {
    return { success: false, error: { message: 'Invalid Horizon account response' } }
  }

  const minReserve = stellarMinReserveXlm(record.subentry_count ?? 0)
  const feePerSorobanTx = Number.parseInt(DEFAULT_SOROBAN_BASE_FEE, 10) / 10_000_000

  const native = record.balances.find((b) => b.asset_type === 'native')
  const balance = native ? Number.parseFloat(native.balance) : 0

  /** After this XLM SAC transfer we must still cover ledger reserve, optional 1.5 XLM floor, and fees for pending token sweeps. */
  const minRemainAfterThisTx =
    Math.max(MIN_XLM_LINGER_ON_CLASSIC_G, minReserve) + feePerSorobanTx * pendingTokenSweepCount
  const transferable = balance - feePerSorobanTx - minRemainAfterThisTx
  if (transferable < 0.000_000_1) {
    return {
      success: false,
      error: {
        message:
          'Not enough XLM on the classic account to migrate native XLM and still leave reserve + fees for remaining steps. Add XLM or migrate fewer assets.',
        code: 'insufficient_xlm',
      },
    }
  }

  /**
   * Classic `Payment` only accepts G/Muxed destinations; smart accounts are `C...` contracts.
   * Move native XLM via the network's native SAC `transfer` (same pattern as issued assets).
   */
  const sacContractId = Asset.native().contractId(passphrase)
  const amountRaw = humanAmountStringToRawUnits(
    transferable.toFixed(STELLAR_SAC_DISPLAY_DECIMALS),
    STELLAR_SAC_DISPLAY_DECIMALS
  )

  const sourceAccount = new Account(g, record.sequence)
  const unsigned = buildUnsignedSacTransferTx({
    sourceAccount,
    sacContractId,
    fromGAddress: g,
    toCAddress: c,
    amountRaw,
    networkPassphrase: passphrase,
    fee: DEFAULT_SOROBAN_BASE_FEE,
  })

  const rpcServer = createRpcServer(rpcUrl)
  let assembled: Transaction
  try {
    assembled = await simulateAndAssembleSoroban(rpcServer, unsigned)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, error: { message: msg, code: 'simulation_failed' } }
  }

  assembled.sign(keypair)

  const sent = await sendAndPollSoroban(rpcServer, assembled, sorobanPollOpts)
  if (sent.status === 'SUCCESS') {
    invalidateDiscoveryCacheForAccount(accountId)
    return { success: true, txHash: sent.hash, ledger: sent.latestLedger }
  }
  return {
    success: false,
    txHash: sent.hash,
    error: {
      message: sent.error ?? 'Soroban transaction failed',
      code: sent.confirmationTimedOut ? 'confirmation_timeout' : 'tx_failed',
    },
  }
}

export async function runMigrationSweepToken(
  accountId: string,
  sacContractId: string
): Promise<MigrationSweepResult> {
  const { accounts } = await getAccounts()
  const account = accounts.find((a) => a.id === accountId)
  if (!account?.gAddress || !account.smartAccountAddress) {
    return {
      success: false,
      error: { message: 'Missing G or smart account address', code: 'missing_addresses' },
    }
  }
  if (account.mode !== 'mnemonic') {
    return {
      success: false,
      error: { message: 'Migration requires a mnemonic account.', code: 'not_mnemonic' },
    }
  }

  const keypair = requireMnemonicKeypair(accountId)
  const g = account.gAddress
  const c = account.smartAccountAddress
  const passphrase = networkPassphraseFromEnv()
  const rpcUrl = sorobanRpcUrlFromEnv()

  const json = await fetchHorizonAccountJson(g)
  const record = parseHorizonAccountJson(json)
  if (!record) {
    return { success: false, error: { message: 'Invalid Horizon account response' } }
  }

  const native = record.balances.find((b) => b.asset_type === 'native')
  const xlmBalance = native ? Number.parseFloat(native.balance) : 0
  const minReserve = stellarMinReserveXlm(record.subentry_count ?? 0)
  const sorobanFeeBuffer = Number.parseInt(DEFAULT_SOROBAN_BASE_FEE, 10) / 10_000_000
  const minSpendableFloor = Math.max(MIN_XLM_LINGER_ON_CLASSIC_G, minReserve)
  if (xlmBalance - minSpendableFloor < sorobanFeeBuffer) {
    return {
      success: false,
      error: {
        message: 'Insufficient XLM on the classic account to pay the Soroban transaction fee.',
        code: 'insufficient_xlm_fee',
      },
    }
  }

  const tokenBal = record.balances.find((b) => {
    if (b.asset_type !== 'credit_alphanum4' && b.asset_type !== 'credit_alphanum12') return false
    try {
      return new Asset(b.asset_code, b.asset_issuer).contractId(passphrase) === sacContractId
    } catch {
      return false
    }
  })

  if (!tokenBal || tokenBal.asset_type === 'native') {
    return {
      success: false,
      error: { message: 'No matching trustline for this token.', code: 'no_trustline' },
    }
  }

  const amountHuman = tokenBal.balance
  if (Number.parseFloat(amountHuman) < 0.000_000_1) {
    return {
      success: false,
      error: { message: 'No balance to migrate for this asset.', code: 'zero_balance' },
    }
  }

  const amountRaw = humanAmountStringToRawUnits(amountHuman, STELLAR_SAC_DISPLAY_DECIMALS)

  const sourceAccount = new Account(g, record.sequence)
  const unsigned = buildUnsignedSacTransferTx({
    sourceAccount,
    sacContractId,
    fromGAddress: g,
    toCAddress: c,
    amountRaw,
    networkPassphrase: passphrase,
    fee: DEFAULT_SOROBAN_BASE_FEE,
  })

  const rpcServer = createRpcServer(rpcUrl)
  let assembled: Transaction
  try {
    assembled = await simulateAndAssembleSoroban(rpcServer, unsigned)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, error: { message: msg, code: 'simulation_failed' } }
  }

  assembled.sign(keypair)

  const sent = await sendAndPollSoroban(rpcServer, assembled, sorobanPollOpts)
  if (sent.status === 'SUCCESS') {
    invalidateDiscoveryCacheForAccount(accountId)
    return { success: true, txHash: sent.hash, ledger: sent.latestLedger }
  }
  return {
    success: false,
    txHash: sent.hash,
    error: {
      message: sent.error ?? 'Soroban transaction failed',
      code: sent.confirmationTimedOut ? 'confirmation_timeout' : 'tx_failed',
    },
  }
}
