import type { ExternalSignResult, SignCallbackResult } from '@latch/types'

const LOCALHOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i

/** Reject dangerous callback schemes; allow https and localhost http. */
export function isAllowedCallbackUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:') return true
    if (parsed.protocol === 'http:' && LOCALHOST_PATTERN.test(trimmed)) return true
    return false
  } catch {
    return false
  }
}

export function assertAllowedCallbackUrl(url: string): void {
  if (!isAllowedCallbackUrl(url)) {
    throw new Error('Callback URL must be https:// or http://localhost')
  }
}

export function buildCallbackUrl(
  callback: string,
  result: SignCallbackResult,
  opts?: { signedAuthEntry?: string; signedTxXdr?: string; submit?: boolean }
): string {
  assertAllowedCallbackUrl(callback)
  const url = new URL(callback)
  if (result.requestId) url.searchParams.set('requestId', result.requestId)
  url.searchParams.set('status', result.status)
  if (result.network) url.searchParams.set('network', result.network)
  if (result.txHash) url.searchParams.set('txHash', result.txHash)
  if (result.code) url.searchParams.set('code', result.code)
  if (result.message) url.searchParams.set('message', result.message)

  let out = url.toString()
  if (opts?.submit === false) {
    // Return signature-only material in the URL fragment so it never hits
    // server logs / referrers; the dApp reads it client-side and submits.
    const parts: string[] = []
    if (opts.signedAuthEntry) {
      parts.push(`signedAuthEntry=${encodeURIComponent(opts.signedAuthEntry)}`)
    }
    if (opts.signedTxXdr) {
      parts.push(`signedTxXdr=${encodeURIComponent(opts.signedTxXdr)}`)
    }
    if (parts.length > 0) {
      out = `${out}#${parts.join('&')}`
    }
  }
  return out
}

export function externalResultToCallback(
  callback: string,
  result: ExternalSignResult,
  submit?: boolean
): string {
  return buildCallbackUrl(
    callback,
    {
      requestId: result.requestId,
      status: result.status,
      txHash: result.txHash,
      network: result.network,
      code: result.code,
      message: result.message,
    },
    { signedAuthEntry: result.signedAuthEntry, signedTxXdr: result.signedTxXdr, submit }
  )
}

export { getActiveNetworkFromEnv } from '../network/config'
