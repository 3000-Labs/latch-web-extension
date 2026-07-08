import type {
  CreateOrConnectFreighterRequest,
  CreateOrConnectFreighterResponse,
  CreateOrConnectPasskeyRequest,
  CreateOrConnectPasskeyResponse,
  CreateOrConnectPhantomRequest,
  CreateOrConnectPhantomResponse,
  FreighterSmartAccountStatusResponse,
} from '@latch/types'

import { latchFetch } from './client'

export async function getFreighterSmartAccountStatus(
  gAddress: string
): Promise<FreighterSmartAccountStatusResponse> {
  const q = encodeURIComponent(gAddress)
  return await latchFetch<FreighterSmartAccountStatusResponse>(
    `/api/smart-account/freighter?gAddress=${q}`,
    { method: 'GET' }
  )
}

export async function createOrConnectFreighter(
  req: CreateOrConnectFreighterRequest
): Promise<CreateOrConnectFreighterResponse> {
  return await latchFetch<CreateOrConnectFreighterResponse>('/api/smart-account/freighter', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

/** GET predict/deploy flow: returns smart account address; POST only if not yet deployed. */
export async function ensureFreighterSmartAccountDeployed(
  gAddress: string
): Promise<CreateOrConnectFreighterResponse> {
  const status = await getFreighterSmartAccountStatus(gAddress)
  if (status.deployed) {
    return { smartAccountAddress: status.smartAccountAddress, alreadyDeployed: true }
  }
  return await createOrConnectFreighter({ gAddress })
}

export async function createOrConnectPhantom(
  req: CreateOrConnectPhantomRequest
): Promise<CreateOrConnectPhantomResponse> {
  return await latchFetch<CreateOrConnectPhantomResponse>('/api/smart-account', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function createOrConnectPasskey(
  req: CreateOrConnectPasskeyRequest
): Promise<CreateOrConnectPasskeyResponse> {
  return await latchFetch<CreateOrConnectPasskeyResponse>('/api/smart-account/webauthn', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}
