import type { SignPayloadStoreResponse } from '@latch/types'

import { latchFetch } from './client'

export async function fetchSignPayload(payloadRef: string): Promise<SignPayloadStoreResponse> {
  const ref = encodeURIComponent(payloadRef)
  return await latchFetch<SignPayloadStoreResponse>(`/api/sign-payload/${ref}`, {
    method: 'GET',
  })
}
