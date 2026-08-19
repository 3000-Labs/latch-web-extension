import type { BackendAccountsResponse } from '@latch/types'

import { latchFetch } from './client'

export async function getBackendAccounts(): Promise<BackendAccountsResponse> {
  return await latchFetch<BackendAccountsResponse>('/api/accounts', { method: 'GET' })
}

export async function setBackendActiveAccount(args: {
  smartAccountAddress: string
}): Promise<{ ok: true }> {
  return await latchFetch<{ ok: true }>('/api/accounts/set-active', {
    method: 'POST',
    body: JSON.stringify(args),
  })
}
