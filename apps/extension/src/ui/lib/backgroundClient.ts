import type { BackgroundMessage, BackgroundResponse, SerializableError } from '@latch/types'

export async function sendToBackground<TPayload, TData>(
  message: BackgroundMessage<TPayload>
): Promise<BackgroundResponse<TData>> {
  return (await chrome.runtime.sendMessage(message)) as BackgroundResponse<TData>
}

export function friendlyError(e?: SerializableError): string {
  if (!e) return 'Unknown error'
  if (e.code === 'timeout') return 'Request timed out. Please try again.'
  if (e.code === 'unhandled_message') {
    return 'Extension background is out of date. Reload Latch on chrome://extensions and try again.'
  }
  if (e.code === 'V1_AUTH_REQUIRED') return 'Sign in required to continue.'
  if (e.code === 'fund_unsupported_mode') {
    return 'Fund via on-ramp is not available for this account type yet.'
  }
  if (e.status === 403) return 'Not authorized.'
  if (e.code === 'mnemonic_locked') {
    return 'Seed signer is not loaded. Unlock with your saved password or re-import your recovery phrase.'
  }
  if (
    e.code === 'internal_error' &&
    typeof e.message === 'string' &&
    /^internal error$/i.test(e.message.trim())
  ) {
    return 'The Latch API accepted your passkey but failed while deploying the smart account. This is usually a backend configuration issue (factory contract, Soroban RPC, or deploy funding on Render).'
  }
  return e.message
}
