import type { PortfolioTokenProbe } from '@latch/stellar'

import { getActiveNetwork } from './network/config'

const MAX_KNOWN_PROBES = 20
const STORAGE_KEY_PREFIX = 'latch.knownSacProbes.v1'

async function storageKey(accountId: string): Promise<string> {
  const network = await getActiveNetwork()
  return `${STORAGE_KEY_PREFIX}:${network}:${accountId}`
}

export async function getKnownSacProbes(accountId: string): Promise<PortfolioTokenProbe[]> {
  try {
    const key = await storageKey(accountId)
    const r = await chrome.storage.local.get([key])
    const raw = r[key]
    if (!Array.isArray(raw)) return []
    return raw.filter(
      (p): p is PortfolioTokenProbe =>
        !!p &&
        typeof p === 'object' &&
        typeof (p as PortfolioTokenProbe).code === 'string' &&
        typeof (p as PortfolioTokenProbe).sacContractId === 'string'
    )
  } catch {
    return []
  }
}

export async function recordKnownSacProbe(
  accountId: string,
  probe: PortfolioTokenProbe
): Promise<void> {
  if (!probe.code || !probe.sacContractId) return
  const existing = await getKnownSacProbes(accountId)
  const filtered = existing.filter((p) => p.sacContractId !== probe.sacContractId)
  const next = [
    {
      code: probe.code,
      issuer: probe.issuer,
      sacContractId: probe.sacContractId,
    },
    ...filtered,
  ].slice(0, MAX_KNOWN_PROBES)
  try {
    const key = await storageKey(accountId)
    await chrome.storage.local.set({ [key]: next })
  } catch {
    // best-effort
  }
}

export async function recordKnownSacProbes(
  accountId: string,
  probes: PortfolioTokenProbe[]
): Promise<void> {
  for (const probe of probes) {
    await recordKnownSacProbe(accountId, probe)
  }
}
