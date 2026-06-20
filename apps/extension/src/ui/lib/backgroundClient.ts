import type { BackgroundMessage, BackgroundResponse, SerializableError } from '@latch/types'

export async function sendToBackground<TPayload, TData>(
  message: BackgroundMessage<TPayload>
): Promise<BackgroundResponse<TData>> {
  return (await chrome.runtime.sendMessage(message)) as BackgroundResponse<TData>
}

export function friendlyError(e?: SerializableError): string {
  if (!e) return 'Unknown error'
  if (e.code === 'timeout') return 'Request timed out. Please try again.'
  if (e.status === 403) return 'Not authorized.'
  if (e.code === 'mnemonic_locked') {
    return 'Seed signer is not loaded. Unlock with your saved password or re-import your recovery phrase.'
  }
  return e.message
}
