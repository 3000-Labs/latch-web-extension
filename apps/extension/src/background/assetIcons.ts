import { StellarToml, StrKey } from '@stellar/stellar-sdk'

import type { GetAssetIconDataUrlsRequest, GetAssetIconDataUrlsResponse } from '@latch/types'

import { getStellarNetworkFromEnv, horizonUrlFromEnv } from './migration/env'

const CACHE_PREFIX = 'latch.assetIconDataUrl.v1'
const MAX_ICON_BYTES = 150_000

function cacheKey(network: string, code: string, issuer: string) {
  return `${CACHE_PREFIX}:${network}:${code}:${issuer}`
}

export async function getCachedIconDataUrl(
  network: string,
  code: string,
  issuer: string,
): Promise<string | null> {
  const k = cacheKey(network, code, issuer)
  const r = await chrome.storage.local.get(k)
  const v = r[k]
  return typeof v === 'string' && v.startsWith('data:') ? v : null
}

async function setCachedIconDataUrl(network: string, code: string, issuer: string, dataUrl: string) {
  await chrome.storage.local.set({ [cacheKey(network, code, issuer)]: dataUrl })
}

function normalizeDomain(raw: string): string {
  const d = raw.trim()
  if (!d) return ''
  try {
    if (d.includes('://')) {
      return new URL(d).hostname
    }
  } catch {
    /* ignore */
  }
  return d.replace(/^https?:\/\//i, '').split('/')[0] ?? ''
}

export async function resolveIconDataUrlForClassicAsset(params: {
  network: 'testnet' | 'mainnet'
  horizonUrl: string
  code: string
  issuer: string
  signal?: AbortSignal
}): Promise<string | null> {
  if (!StrKey.isValidEd25519PublicKey(params.issuer)) return null

  const cached = await getCachedIconDataUrl(params.network, params.code, params.issuer)
  if (cached) return cached

  const accUrl = `${params.horizonUrl.replace(/\/$/, '')}/accounts/${encodeURIComponent(params.issuer)}`
  const res = await fetch(accUrl, { headers: { Accept: 'application/json' }, signal: params.signal })
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
    if (cur.code === params.code && cur.issuer === params.issuer && cur.image && typeof cur.image === 'string') {
      const imgUrl = cur.image.trim()
      if (!imgUrl.toLowerCase().startsWith('https://')) return null
      try {
        const imgRes = await fetch(imgUrl, { signal: params.signal })
        if (!imgRes.ok) return null
        const buf = await imgRes.arrayBuffer()
        if (buf.byteLength > MAX_ICON_BYTES) return null
        const bytes = new Uint8Array(buf)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
        const b64 = btoa(binary)
        const ct = imgRes.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png'
        if (!ct.startsWith('image/')) return null
        const dataUrl = `data:${ct};base64,${b64}`
        await setCachedIconDataUrl(params.network, params.code, params.issuer, dataUrl)
        return dataUrl
      } catch {
        return null
      }
    }
  }
  return null
}

export async function getAssetIconDataUrlsBatch(
  req: GetAssetIconDataUrlsRequest,
): Promise<GetAssetIconDataUrlsResponse> {
  const network = getStellarNetworkFromEnv()
  const horizonUrl = horizonUrlFromEnv()
  const icons = await Promise.all(
    req.assets.map((a) =>
      resolveIconDataUrlForClassicAsset({
        network,
        horizonUrl,
        code: a.code,
        issuer: a.issuer,
      }),
    ),
  )
  return { icons }
}
