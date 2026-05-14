/**
 * @latch/stellar
 * Stellar/Soroban client logic — network calls, XDR helpers, transaction lifecycle.
 * No key material here. Signing happens in the background service worker only.
 */

export type { Network } from '@latch/types'

export type { HorizonAccountRecord, HorizonBalanceLine } from './horizonTypes'
export { isHorizonCreditBalance } from './horizonTypes'

export {
  migrableAssetsFromHorizonAccount,
  parseHorizonAccountJson,
  stellarMinReserveXlm,
} from './migrationBalances'

export { buildClassicNativePaymentTx } from './classicXlmPayment'
export { buildUnsignedSacTransferTx } from './sacTransfer'

export {
  createRpcServer,
  DEFAULT_SOROBAN_BASE_FEE,
  sendAndPollSoroban,
  simulateAndAssembleSoroban,
} from './sorobanPipeline'

export {
  createHorizonServer,
  pollHorizonTransaction,
  submitClassicTransaction,
} from './horizonClassic'

export { humanAmountStringToRawUnits } from './amountRaw'
export { fetchSacBalanceRaw, formatSacRawToHuman, STELLAR_SAC_DISPLAY_DECIMALS } from './sacBalance'
export { loadSmartAccountPortfolioRows } from './smartAccountPortfolio'
export type { SmartAccountPortfolioRow, PortfolioTokenProbe } from './smartAccountPortfolio'
