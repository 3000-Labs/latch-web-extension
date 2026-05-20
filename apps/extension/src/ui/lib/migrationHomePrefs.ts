const STORAGE_KEY = 'latch.migration.homePromoCompleted.v1' as const

async function readCompletedIds(): Promise<Set<string>> {
  const res = await chrome.storage.local.get([STORAGE_KEY])
  const raw = res[STORAGE_KEY]
  if (!Array.isArray(raw)) return new Set()
  return new Set(raw.filter((id): id is string => typeof id === 'string'))
}

export async function isMigrationHomePromoCompleted(accountId: string): Promise<boolean> {
  const ids = await readCompletedIds()
  return ids.has(accountId)
}

export async function markMigrationHomePromoCompleted(accountId: string): Promise<void> {
  const ids = await readCompletedIds()
  ids.add(accountId)
  await chrome.storage.local.set({ [STORAGE_KEY]: [...ids] })
}
