import React, { useCallback, useEffect, useState } from 'react'

import type {
  BackgroundMessage,
  BackgroundResponse,
  GetAssetIconDataUrlsRequest,
  GetAssetIconDataUrlsResponse,
  MigrationDiscoverRequest,
  MigrationDiscovery,
  MigrationSweepResult,
  MigrationSweepTokenRequest,
  MigrationSweepXlmRequest,
} from '@latch/types'

import { TokenAvatar } from '../components/TokenAvatar'
import { TransactionStepper } from '../components/TransactionStepper'
import {
  buildMigrationTxSteps,
  formatMigrationStepTime,
  type MigrationTxUiPhase,
} from '../migration/migrationTxSteps'

async function sendToBackground<T>(message: BackgroundMessage): Promise<BackgroundResponse<T>> {
  return (await chrome.runtime.sendMessage(message)) as BackgroundResponse<T>
}

type Surface = 'popup' | 'sidepanel'

function stellarExpertTxUrl(hash: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
  const net = network === 'mainnet' ? 'public' : 'testnet'
  return `https://stellar.expert/explorer/${net}/tx/${encodeURIComponent(hash)}`
}

function friendlySweepError(err?: { message?: string; code?: string }): string {
  if (!err) return 'Unknown error'
  if (err.code === 'mnemonic_locked') {
    return 'Unlock your saved recovery phrase password first, then try again.'
  }
  if (err.code === 'confirmation_timeout') {
    return `${err.message} The transaction may still confirm — check the explorer link below.`
  }
  return err.message ?? 'Transaction failed'
}

export function MigrationScreen({
  surface: _surface,
  accountId,
  network = 'testnet',
  onBack,
  onDone,
  onNeedUnlock,
}: {
  surface: Surface
  accountId: string
  network?: 'testnet' | 'mainnet'
  onBack: () => void
  onDone: () => void
  onNeedUnlock: () => void
}) {
  void _surface

  const [discovery, setDiscovery] = useState<MigrationDiscovery | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sweepError, setSweepError] = useState<string | null>(null)

  const [txPhase, setTxPhase] = useState<MigrationTxUiPhase>('idle')
  const [txTimes, setTxTimes] = useState<{
    initiated?: string
    submitted?: string
    confirmed?: string
  }>({})
  const [activeAssetLabel, setActiveAssetLabel] = useState<string | null>(null)
  const [lastSweepTxHash, setLastSweepTxHash] = useState<string | null>(null)
  const [assetIcons, setAssetIcons] = useState<Record<string, string | null>>({})

  const refresh = useCallback(async () => {
    setLoadError(null)
    const res = await sendToBackground<MigrationDiscovery>({
      type: 'MIGRATION_DISCOVER',
      payload: { accountId } satisfies MigrationDiscoverRequest,
    })
    if (!res.ok) {
      setLoadError(res.error?.message ?? 'Could not load migration state')
      setDiscovery(null)
      return
    }
    setDiscovery(res.data ?? null)
  }, [accountId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!discovery?.assets?.length) {
      setAssetIcons({})
      return
    }
    const tokens = discovery.assets.filter((a) => a.kind === 'token' && a.issuer)
    if (tokens.length === 0) {
      setAssetIcons({})
      return
    }
    let cancelled = false
    void (async () => {
      const res = await sendToBackground<GetAssetIconDataUrlsResponse>({
        type: 'GET_ASSET_ICON_DATA_URLS',
        payload: {
          assets: tokens.map((t) => ({ code: t.code, issuer: t.issuer! })),
        } satisfies GetAssetIconDataUrlsRequest,
      })
      if (cancelled || !res.ok || !res.data) return
      const next: Record<string, string | null> = {}
      tokens.forEach((t, i) => {
        next[`${t.code}:${t.issuer}`] = res.data!.icons[i] ?? null
      })
      setAssetIcons(next)
    })()
    return () => {
      cancelled = true
    }
  }, [discovery])

  const runSweepWithStepper = async (
    label: string,
    run: () => Promise<BackgroundResponse<MigrationSweepResult>>
  ): Promise<boolean> => {
    setActiveAssetLabel(label)
    setTxPhase('idle')
    setTxTimes({})
    setSweepError(null)
    setLastSweepTxHash(null)

    const tInit = formatMigrationStepTime()
    setTxTimes({ initiated: tInit })
    setTxPhase('initiated')

    const res = await run()
    if (!res.ok) {
      if (res.error?.code === 'mnemonic_locked') {
        onNeedUnlock()
      }
      setSweepError(res.error?.message ?? 'Request failed')
      setTxPhase('failed')
      return false
    }

    const data = res.data
    if (!data?.success) {
      if (data?.txHash) setLastSweepTxHash(data.txHash)
      if (data?.error?.code === 'mnemonic_locked') {
        onNeedUnlock()
      }
      setSweepError(friendlySweepError(data?.error))
      setTxPhase('failed')
      return false
    }

    const tSub = formatMigrationStepTime()
    setTxTimes((prev) => ({ ...prev, submitted: tSub }))
    setTxPhase('submitted')
    await new Promise((r) => setTimeout(r, 320))

    const tConf = formatMigrationStepTime()
    setTxTimes((prev) => ({ ...prev, confirmed: tConf }))
    setTxPhase('confirmed')
    await new Promise((r) => setTimeout(r, 220))
    return true
  }

  const handleMigrateAll = async () => {
    if (!discovery?.assets.length) return
    setBusy(true)
    setSweepError(null)

    try {
      const native = discovery.assets.find((a) => a.kind === 'native')
      const tokens = discovery.assets.filter((a) => a.kind === 'token')

      if (native) {
        const ok = await runSweepWithStepper('XLM', () =>
          sendToBackground<MigrationSweepResult>({
            type: 'MIGRATION_SWEEP_XLM',
            payload: {
              accountId,
              pendingTokenSweepCount: tokens.length,
            } satisfies MigrationSweepXlmRequest,
          })
        )
        if (!ok) {
          setBusy(false)
          return
        }
      }

      for (const t of tokens) {
        const ok = await runSweepWithStepper(t.code, () =>
          sendToBackground<MigrationSweepResult>({
            type: 'MIGRATION_SWEEP_TOKEN',
            payload: {
              accountId,
              sacContractId: t.sacContractId,
            } satisfies MigrationSweepTokenRequest,
          })
        )
        if (!ok) {
          setBusy(false)
          return
        }
      }

      await refresh()
      onDone()
    } finally {
      setBusy(false)
      setActiveAssetLabel(null)
      setTxPhase('idle')
    }
  }

  const steps = buildMigrationTxSteps(txPhase, txTimes)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="rounded-full px-2 py-1 text-sm font-extrabold text-primary hover:bg-surface/60 disabled:opacity-50"
        >
          Back
        </button>
      </div>

      <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight">Migrate assets</h2>
      <p className="mt-2 px-1 text-center text-xs leading-relaxed text-muted">
        Move balances from your classic Stellar account (G) to your smart account (C). Each step is
        submitted on-chain.
      </p>

      {loadError ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface/60 px-3 py-3 text-sm text-fg">
          {loadError}
        </div>
      ) : null}

      {!loadError && discovery?.state === 'unsupported' ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface/60 px-3 py-3 text-sm text-muted">
          {discovery.unsupportedReason === 'not_mnemonic'
            ? 'Migration is available for accounts imported with a recovery phrase in Latch.'
            : 'This account is missing a classic address or smart account address.'}
        </div>
      ) : null}

      {!loadError && discovery?.state === 'not_needed' ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface/60 px-3 py-3 text-sm text-muted">
          No classic account data to migrate.
        </div>
      ) : null}

      {!loadError && discovery?.state === 'complete' ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface/60 px-3 py-3 text-sm text-fg">
          Nothing left to migrate for this account.
        </div>
      ) : null}

      {!loadError && discovery?.state === 'not_started' && discovery.assets.length > 0 ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
          <div className="rounded-2xl border border-border bg-surface/60 p-3 shadow-soft">
            <div className="text-xs font-extrabold text-muted">Classic account</div>
            <div className="mt-1 break-all font-mono text-[11px] text-fg/90">
              {discovery.gAddress}
            </div>
            <div className="mt-3 text-xs font-extrabold text-muted">Smart account</div>
            <div className="mt-1 break-all font-mono text-[11px] text-fg/90">
              {discovery.cAddress}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface/60 p-3 shadow-soft">
            <div className="text-xs font-extrabold text-muted">Assets</div>
            <ul className="mt-2 space-y-2">
              {discovery.assets.map((a) => {
                const iconKey = a.kind === 'token' && a.issuer ? `${a.code}:${a.issuer}` : null
                const iconUrl = iconKey ? assetIcons[iconKey] : null
                return (
                  <li
                    key={`${a.kind}-${a.code}-${a.sacContractId}`}
                    className="flex items-center justify-between gap-2 text-sm font-bold"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <TokenAvatar symbol={a.code} iconUrl={iconUrl} className="h-8 w-8" />
                      <span className="truncate">{a.code}</span>
                    </div>
                    <span className="shrink-0 text-muted">{a.amount}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          {activeAssetLabel && txPhase !== 'idle' ? (
            <div className="rounded-[16px] bg-[#161616] px-3 py-4 mt-2">
              <div className="text-center text-[13px] font-semibold text-[#8E8E93]">
                Current transaction
              </div>
              <div className="mt-1 text-center text-[16px] font-bold text-white">
                {activeAssetLabel}
              </div>
              <div className="mt-5 pb-2">
                <TransactionStepper steps={steps} />
              </div>
            </div>
          ) : null}

          {sweepError ? (
            <div className="rounded-2xl border border-red-500/40 bg-surface/60 px-3 py-2 text-xs text-red-200">
              <div>{sweepError}</div>
              {lastSweepTxHash ? (
                <div className="mt-2 break-all font-mono text-[10px] text-red-100/90">
                  Tx: {lastSweepTxHash}
                </div>
              ) : null}
              {lastSweepTxHash ? (
                <a
                  href={stellarExpertTxUrl(lastSweepTxHash, network)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-[11px] font-extrabold text-primary underline"
                >
                  View on Stellar Expert
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="mt-auto space-y-2 pb-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleMigrateAll()}
              className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft disabled:opacity-50"
            >
              {busy ? 'Working…' : 'Migrate all'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
