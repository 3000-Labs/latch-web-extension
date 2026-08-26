import type { BackgroundMessage, BackgroundResponse, SerializableError } from '@latch/types'

export type UiErrorOperation = 'account-hydrate' | 'send' | 'swap' | 'dapp'

type LogStructuredErrorOptions = {
  dedupeKey?: string
  metadata?: Record<string, unknown>
}

const ERROR_LOG_DEDUPE_WINDOW_MS = 30_000
const recentErrorLogs = new Map<string, number>()

export async function sendToBackground<TPayload, TData>(
  message: BackgroundMessage<TPayload>
): Promise<BackgroundResponse<TData>> {
  return (await chrome.runtime.sendMessage(message)) as BackgroundResponse<TData>
}

/** Convert thrown values into the serializable shape used by background responses. */
export function toSerializableError(error: unknown): SerializableError {
  if (isSerializableError(error)) return error
  if (error instanceof Error) return { message: error.message || error.name }
  return { message: String(error) }
}

function isSerializableError(error: unknown): error is SerializableError {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { message?: unknown; code?: unknown; status?: unknown }
  return (
    typeof candidate.message === 'string' &&
    (candidate.code === undefined || typeof candidate.code === 'string') &&
    (candidate.status === undefined || typeof candidate.status === 'number')
  )
}

export function friendlyError(e?: SerializableError): string {
  if (!e) return 'Unknown error'
  if (e.code === 'timeout') return 'Request timed out. Please try again.'
  if (e.code === 'unhandled_message') {
    return 'Extension background is out of date. Reload Latch on chrome://extensions and try again.'
  }
  if (e.code === 'extension_unreachable') {
    return 'Latch background is unavailable. Reload the extension and try again.'
  }
  if (e.code === 'V1_AUTH_REQUIRED') return 'Sign in required to continue.'
  if (e.code === 'fund_unsupported_mode') {
    return 'Fund via on-ramp is not available for this account type yet.'
  }
  if (e.code === 'network_mismatch') {
    return (
      e.message ||
      'The Latch API challenge network does not match your active wallet network. Switch network or try again.'
    )
  }
  if (e.code === 'moonpay_network_mismatch') {
    return (
      e.message ||
      'MoonPay live keys cannot be used while the wallet is on testnet. Use a sandbox key or switch to mainnet.'
    )
  }
  if (e.code === 'moonpay_unsigned_url') {
    return (
      e.message ||
      'MoonPay did not return a signed widget URL. Funding cannot open an unsigned live buy link.'
    )
  }
  if (e.code === 'transak_missing_widget_url') {
    return e.message || 'Transak did not return a widget URL. Please try again shortly.'
  }
  if (typeof e.message === 'string' && /failed to build setup transaction/i.test(e.message)) {
    return 'Could not set up send rules. Your smart account may not be deployed on this network yet — try again after the account finishes deploying.'
  }
  if (e.status === 403) return 'Not authorized.'
  if (e.code === 'mnemonic_locked') {
    return 'Seed signer is not loaded. Unlock with your saved password or re-import your recovery phrase.'
  }
  if (
    (e.code === 'internal_error' || e.code === 'INTERNAL_ERROR') &&
    typeof e.message === 'string' &&
    /^internal error$/i.test(e.message.trim())
  ) {
    return (
      'The Latch API returned an internal error. This is usually a backend configuration issue ' +
      '(funding relayer, Soroban RPC, or deploy funding on Render). Try again shortly.'
    )
  }
  return typeof e.message === 'string' && e.message.trim() ? e.message : 'Unknown error'
}

/** Safe copy for user-visible operation failures; raw details remain in structured logs. */
export function formatOperationError(error: unknown, operation: UiErrorOperation): string {
  const normalized = toSerializableError(error)
  const message = friendlyError(normalized)
  const isGenericInternalError =
    (normalized.code === 'internal_error' || normalized.code === 'INTERNAL_ERROR') &&
    /^internal error$/i.test(normalized.message.trim())

  if (isGenericInternalError) {
    if (operation === 'send') {
      return 'Your send could not be completed because the wallet service is temporarily unavailable. Please try again shortly.'
    }
    if (operation === 'swap') {
      return 'Your swap could not be completed because the swap service is temporarily unavailable. Please try again shortly.'
    }
    if (operation === 'dapp') {
      return 'The dApp request could not be completed because the wallet service is temporarily unavailable. Please try again shortly.'
    }
  }

  return message
}

/**
 * Emit a structured, deduplicated error without showing a toast. Prefetch and retry
 * failures use this so developers get a signal without interrupting the wallet UX.
 */
export function logStructuredError(
  scope: string,
  error: unknown,
  options: LogStructuredErrorOptions = {}
): void {
  const normalized = toSerializableError(error)
  const dedupeKey = options.dedupeKey ?? `${scope}:${normalized.code ?? ''}:${normalized.message}`
  const now = Date.now()
  const lastLoggedAt = recentErrorLogs.get(dedupeKey)
  if (lastLoggedAt !== undefined && now - lastLoggedAt < ERROR_LOG_DEDUPE_WINDOW_MS) return
  recentErrorLogs.set(dedupeKey, now)

  console.error(`[latch:${scope}]`, {
    error: normalized,
    ...options.metadata,
  })
}

/** Log a failure and optionally expose only safe copy to the current screen. */
export function reportUiError(
  scope: string,
  error: unknown,
  setError?: (message: string) => void,
  options: LogStructuredErrorOptions & { operation?: UiErrorOperation } = {}
): string {
  logStructuredError(scope, error, options)
  const message = formatOperationError(error, options.operation ?? 'account-hydrate')
  setError?.(message)
  return message
}
