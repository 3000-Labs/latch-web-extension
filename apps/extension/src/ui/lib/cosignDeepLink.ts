/** Parse cosign join token from extension page URL query params. */
export function parseCosignJoinTokenFromLocation(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const token = params.get('cosignJoin')?.trim() ?? params.get('multisigJoin')?.trim()
  return token || null
}

/**
 * Extract an invite token from pasted text — raw token, full invite URL, or query string.
 */
export function parseInviteTokenFromInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (trimmed.includes('cosignJoin=') || trimmed.includes('multisigJoin=')) {
    const query = trimmed.includes('?') ? trimmed.slice(trimmed.indexOf('?')) : `?${trimmed}`
    const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query)
    const fromQuery =
      params.get('cosignJoin')?.trim() ?? params.get('multisigJoin')?.trim()
    if (fromQuery) return fromQuery
  }

  if (trimmed.includes('://')) {
    try {
      const url = new URL(trimmed)
      const fromUrl =
        url.searchParams.get('cosignJoin')?.trim() ??
        url.searchParams.get('multisigJoin')?.trim()
      if (fromUrl) return fromUrl
    } catch {
      // fall through to raw token
    }
  }

  if (!trimmed.includes(' ') && trimmed.length >= 8 && trimmed.length <= 128) {
    return trimmed
  }

  return null
}

export const COSIGN_JOIN_TAB_PAGE = 'tabs/multisig-join.html'

export function buildCosignInviteUrl(inviteToken: string): string {
  const base = chrome.runtime.getURL(COSIGN_JOIN_TAB_PAGE)
  // Prefer legacy query key so draft/join backend flow deep links stay canonical.
  return `${base}?multisigJoin=${encodeURIComponent(inviteToken)}`
}

export function clearCosignJoinQueryFromLocation(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  let changed = false
  for (const key of ['cosignJoin', 'multisigJoin']) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      changed = true
    }
  }
  if (!changed) return
  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState({}, '', next)
}

/** @deprecated Use cosign join helpers */
export const parseMultisigJoinTokenFromLocation = parseCosignJoinTokenFromLocation
export const buildMultisigInviteUrl = buildCosignInviteUrl
export const clearMultisigJoinQueryFromLocation = clearCosignJoinQueryFromLocation
export const parseMultisigInviteTokenFromInput = parseInviteTokenFromInput
