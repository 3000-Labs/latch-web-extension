/**
 * Clear in-memory caches that are network-scoped when the user switches networks.
 */

import { clearSmartAccountBalancesMemoryCache } from '../smartAccountBalances'
import { clearSmartAccountTransactionsMemoryCache } from '../smartAccountTransactions'
import { clearQuoteCache } from '../swap/quoteCache'
import { resetSwapProviderRegistryCacheForTests } from '../swap/providerRegistry'
import { clearDiscoveryCache } from '../migration/discoveryCache'

export function clearNetworkScopedMemoryCaches(): void {
  clearQuoteCache()
  resetSwapProviderRegistryCacheForTests()
  clearSmartAccountBalancesMemoryCache()
  clearSmartAccountTransactionsMemoryCache()
  clearDiscoveryCache()
}
