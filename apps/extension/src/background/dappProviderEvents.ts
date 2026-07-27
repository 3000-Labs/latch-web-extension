/**
 * Notify open tabs that the active Latch account (or network) changed so
 * injected `window.latch` can emit accountChanged / networkChanged.
 */

import type { LatchAccountChangedPayload, LatchProviderEventMessage, Network } from '@latch/types'

import { getActiveNetwork } from './network/config'
import { getAccounts } from './storage'

async function broadcastProviderEvent(
  event: 'accountChanged' | 'networkChanged',
  data: LatchAccountChangedPayload
): Promise<void> {
  const message: LatchProviderEventMessage = {
    type: 'LATCH_PROVIDER_EVENT',
    event,
    data,
  }

  const tabs = await chrome.tabs.query({})
  await Promise.allSettled(
    tabs.map(async (tab) => {
      if (tab.id == null) return
      try {
        await chrome.tabs.sendMessage(tab.id, message)
      } catch {
        // Tab may not have the provider-bridge content script.
      }
    })
  )
}

export async function broadcastActiveAccountChanged(): Promise<void> {
  const { accounts, activeAccountId } = await getAccounts()
  const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
  const publicKey = active?.smartAccountAddress?.trim()
  if (!publicKey) return

  const data: LatchAccountChangedPayload = {
    publicKey,
    network: await getActiveNetwork(),
  }

  await broadcastProviderEvent('accountChanged', data)
}

export async function broadcastNetworkChanged(network?: Network): Promise<void> {
  const activeNetwork = network ?? (await getActiveNetwork())
  const { accounts, activeAccountId } = await getAccounts()
  const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
  const publicKey = active?.smartAccountAddress?.trim() ?? ''

  const data: LatchAccountChangedPayload = {
    publicKey,
    network: activeNetwork,
  }

  await broadcastProviderEvent('networkChanged', data)
}
