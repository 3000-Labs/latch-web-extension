/**
 * Re-exports network helpers for migration + legacy call sites.
 * Prefer importing from `../network/config` for new code.
 */

export {
  getActiveNetwork,
  getNetworkConfig,
  getStellarNetworkFromEnv,
  horizonUrlFor,
  horizonUrlFromEnv,
  networkPassphraseFor,
  networkPassphraseFromEnv,
  sorobanRpcUrlFor,
  sorobanRpcUrlFromEnv,
  type StellarNetworkId,
} from '../network/config'
