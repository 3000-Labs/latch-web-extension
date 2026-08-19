import { listPendingCosignRequests } from '../api/cosign/cosignQueue'
import { discoverMembershipsForAccount } from './membership'
import { deriveQueueIndex } from './crypto'
import { listCosignWalletRecords, wckBytesFromRecord } from './wckStorage'
import { getAccounts } from '../storage'
import { hasReachedThreshold } from '../api/cosign/cosignQueue'

const LAST_SEEN_KEY = 'latch.cosignLastSeenState'

type LastSeenState = Record<string, { signatureCount: number; status: string }>

async function readLastSeen(): Promise<LastSeenState> {
  const res = await chrome.storage.local.get(LAST_SEEN_KEY)
  return (res[LAST_SEEN_KEY] as LastSeenState | undefined) ?? {}
}

async function writeLastSeen(state: LastSeenState): Promise<void> {
  await chrome.storage.local.set({ [LAST_SEEN_KEY]: state })
}

export async function runCosignPollCycle(): Promise<number> {
  let notified = 0
  const { accounts } = await getAccounts()
  const passkeyOrSeed = accounts.filter(
    (a) => a.mode === 'passkey' || a.mode === 'freighter' || a.mode === 'mnemonic'
  )

  for (const linked of passkeyOrSeed) {
    try {
      await discoverMembershipsForAccount(linked)
    } catch {
      // best-effort
    }
  }

  const records = await listCosignWalletRecords()
  const lastSeen = await readLastSeen()
  const nextSeen: LastSeenState = { ...lastSeen }

  for (const record of records) {
    try {
      const queueIndex = await deriveQueueIndex(wckBytesFromRecord(record), record.walletRef)
      const pending = await listPendingCosignRequests(record.walletRef, queueIndex)
      for (const req of pending) {
        const prev = lastSeen[req.id]
        const sigCount = req.signature_count ?? req.signatures?.length ?? 0
        const changed = !prev || prev.signatureCount !== sigCount || prev.status !== req.status
        nextSeen[req.id] = { signatureCount: sigCount, status: req.status }

        if (!changed) continue

        const title = hasReachedThreshold(req)
          ? 'Multisig ready to execute'
          : 'Multisig transaction update'
        const message = hasReachedThreshold(req)
          ? `${record.label}: threshold reached`
          : `${record.label}: ${sigCount}/${req.threshold} signatures`

        if (chrome.notifications?.create) {
          await chrome.notifications.create(`cosign-${req.id}`, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/brand/latch-logo.svg'),
            title,
            message,
          })
          notified += 1
        }
      }
    } catch {
      // ignore per-wallet errors
    }
  }

  await writeLastSeen(nextSeen)
  return notified
}

export function registerCosignPolling(periodMinutes = 1): void {
  const alarm = 'latch-cosign-poll'
  chrome.alarms.create(alarm, { periodInMinutes: periodMinutes })
  chrome.alarms.onAlarm.addListener((a) => {
    if (a.name === alarm) void runCosignPollCycle()
  })
}
