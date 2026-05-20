import { StellarToml, StrKey } from '@stellar/stellar-sdk'

import type { GetAssetIconDataUrlsRequest, GetAssetIconDataUrlsResponse } from '@latch/types'

import { coinCapIconUrl, fetchTokenMap, iconFromTokenMap } from './assetTokenLists'
import { getStellarNetworkFromEnv, horizonUrlFromEnv } from './migration/env'

const CACHE_PREFIX = 'latch.assetIconDataUrl.v4'
const MAX_ICON_BYTES = 200_000

function cacheKey(network: string, code: string, issuerOrNative: string) {
  return `${CACHE_PREFIX}:${network}:${code}:${issuerOrNative}`
}

export async function getCachedIconDataUrl(
  network: string,
  code: string,
  issuerOrNative: string
): Promise<string | null> {
  const k = cacheKey(network, code, issuerOrNative)
  const r = await chrome.storage.local.get(k)
  const v = r[k]
  return typeof v === 'string' && v.startsWith('data:') ? v : null
}

async function setCachedIconDataUrl(
  network: string,
  code: string,
  issuerOrNative: string,
  dataUrl: string
) {
  await chrome.storage.local.set({ [cacheKey(network, code, issuerOrNative)]: dataUrl })
}

function normalizeDomain(raw: string): string {
  const d = raw.trim()
  if (!d) return ''
  try {
    if (d.includes('://')) return new URL(d).hostname
  } catch {
    /* ignore */
  }
  return d.replace(/^https?:\/\//i, '').split('/')[0] ?? ''
}

async function httpsUrlToDataUrl(httpsUrl: string, signal?: AbortSignal): Promise<string | null> {
  const url = httpsUrl.trim()
  if (!url.toLowerCase().startsWith('https://')) return null
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    if (buf.byteLength === 0 || buf.byteLength > MAX_ICON_BYTES) return null
    const bytes = new Uint8Array(buf)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
    const b64 = btoa(binary)
    const ct = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png'
    if (!ct.startsWith('image/') && ct !== 'image/svg+xml') {
      if (url.endsWith('.svg')) return `data:image/svg+xml;base64,${b64}`
      return `data:image/png;base64,${b64}`
    }
    return `data:${ct};base64,${b64}`
  } catch {
    return null
  }
}

async function resolveIconUrlFromToml(params: {
  horizonUrl: string
  code: string
  issuer: string
  signal?: AbortSignal
}): Promise<string | null> {
  const accUrl = `${params.horizonUrl.replace(/\/$/, '')}/accounts/${encodeURIComponent(params.issuer)}`
  const res = await fetch(accUrl, {
    headers: { Accept: 'application/json' },
    signal: params.signal,
  })
  if (!res.ok) return null
  const body = (await res.json()) as { home_domain?: string }
  const domain = normalizeDomain(body.home_domain ?? '')
  if (!domain) return null

  let toml: Awaited<ReturnType<typeof StellarToml.Resolver.resolve>>
  try {
    toml = await StellarToml.Resolver.resolve(domain)
  } catch {
    return null
  }

  if (!toml.CURRENCIES) return null
  for (const cur of toml.CURRENCIES) {
    if (
      cur.code === params.code &&
      cur.issuer === params.issuer &&
      cur.image &&
      typeof cur.image === 'string'
    ) {
      const imgUrl = cur.image.trim()
      if (imgUrl.toLowerCase().startsWith('https://')) return imgUrl
    }
  }
  return null
}

async function resolveHttpsIconUrl(params: {
  network: 'testnet' | 'mainnet'
  horizonUrl: string
  code: string
  issuer?: string
  sacContractId?: string
  signal?: AbortSignal
}): Promise<string | null> {
  const code = params.code
  const codeUpper = code.toUpperCase()

  if (codeUpper === 'XLM' && !params.issuer) {
    return null
  }

  const map = await fetchTokenMap(params.network)
  const fromList = iconFromTokenMap(map, {
    code,
    issuer: params.issuer,
    sacContractId: params.sacContractId,
  })
  if (fromList) return fromList

  if (params.issuer && StrKey.isValidEd25519PublicKey(params.issuer)) {
    const fromToml = await resolveIconUrlFromToml({
      horizonUrl: params.horizonUrl,
      code,
      issuer: params.issuer,
      signal: params.signal,
    })
    if (fromToml) return fromToml
  }

  if (codeUpper !== 'XLM') {
    return coinCapIconUrl(code)
  }

  return null
}

/**
 * Resolve token icon as a data: URL (fetched in the service worker).
 * Extension UI pages cannot load arbitrary https:// images under default MV3 CSP;
 * inlining here matches Freighter's cached URL pattern while staying CSP-safe.
 */
export async function resolveIconDataUrlForAsset(params: {
  network: 'testnet' | 'mainnet'
  horizonUrl: string
  code: string
  issuer?: string
  sacContractId?: string
  signal?: AbortSignal
}): Promise<string | null> {
  const cacheId = params.issuer ?? 'native'

  if (params.code.toUpperCase() === 'XLM' && !params.issuer) {
    return null
  }

  const cached = await getCachedIconDataUrl(params.network, params.code, cacheId)
  if (cached) return cached

  const httpsUrl = await resolveHttpsIconUrl(params)
  if (!httpsUrl) return null

  const dataUrl = await httpsUrlToDataUrl(httpsUrl, params.signal)
  if (dataUrl) {
    await setCachedIconDataUrl(params.network, params.code, cacheId, dataUrl)
  }
  return dataUrl
}

/** @deprecated alias */
export const resolveIconUrlForAsset = resolveIconDataUrlForAsset

export async function getAssetIconDataUrlsBatch(
  req: GetAssetIconDataUrlsRequest
): Promise<GetAssetIconDataUrlsResponse> {
  const network = getStellarNetworkFromEnv()
  const horizonUrl = horizonUrlFromEnv()
  const icons = await Promise.all(
    req.assets.map((a) =>
      resolveIconDataUrlForAsset({
        network,
        horizonUrl,
        code: a.code,
        issuer: a.issuer,
        sacContractId: a.sacContractId,
      })
    )
  )
  return { icons }
}
