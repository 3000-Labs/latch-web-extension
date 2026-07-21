import React, { useState } from 'react'
import { ChevronRight } from 'lucide-react'

import backIconUrl from 'url:../../../../assets/home/icon-back.svg'

import { startMoonPayOnRamp } from '../../fund/startMoonPayOnRamp'

function FundProviderRow({
  title,
  description,
  badge,
  disabled,
  busy,
  onClick,
}: {
  title: string
  description: string
  badge: string
  disabled?: boolean
  busy?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className={[
        'flex w-full items-center gap-3 rounded-[14px] bg-[#2a2928] p-3 text-left',
        disabled || busy ? 'cursor-not-allowed opacity-50' : 'hover:bg-[#323130]',
      ].join(' ')}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
        {badge}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
          {title}
        </span>
        <span className="mt-1 block text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
          {description}
        </span>
      </span>
      {!disabled ? (
        <ChevronRight className="size-5 shrink-0 text-[#b3b3b3]" aria-hidden />
      ) : (
        <span className="shrink-0 rounded-full bg-[#3a3938] px-2 py-0.5 text-[11px] font-medium text-[#b3b3b3]">
          Coming soon
        </span>
      )}
    </button>
  )
}

export function FundScreen({
  accountId,
  accountMode,
  passkeyCredentialId,
  surface,
  onBack,
  onOpenReceive,
}: {
  accountId: string
  accountMode: string
  passkeyCredentialId?: string
  surface: 'popup' | 'sidepanel'
  onBack: () => void
  onOpenReceive: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const moonPayDisabled = accountMode === 'multisig'

  const onMoonPay = async () => {
    if (busy || moonPayDisabled) return
    setError(null)
    setBusy(true)
    try {
      await startMoonPayOnRamp({
        accountId,
        passkeyCredentialId,
        surface,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="grid h-[22px] shrink-0 grid-cols-[20px_1fr_20px] items-center">
        <button type="button" onClick={onBack} className="size-5 shrink-0" aria-label="Back">
          <img src={backIconUrl} alt="" className="size-5" aria-hidden />
        </button>
        <p className="text-center text-sm font-medium tracking-[-0.14px] text-[#fbfbfb]">Fund</p>
        <div aria-hidden />
      </div>

      <div className="flex w-full flex-col gap-2">
        <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
          Buy XLM
        </h1>
        <p className="text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
          Choose a provider. Funds are routed to your smart account via a one-time memo.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-4">
        <div className="flex w-full flex-col gap-3">
          <FundProviderRow
            title="MoonPay"
            description={
              moonPayDisabled
                ? 'Not available for multisig wallets yet'
                : busy
                  ? 'Opening MoonPay…'
                  : 'Card & bank transfer · 150+ countries'
            }
            badge="MP"
            disabled={moonPayDisabled}
            busy={busy}
            onClick={() => void onMoonPay()}
          />
          <FundProviderRow
            title="Fonbnk"
            description="Mobile money & local rails"
            badge="FB"
            disabled
          />

          {error ? (
            <p className="text-[13px] font-normal leading-[1.4] text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-3 pb-1">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#2B2A29]" />
            <span className="text-[13px] font-medium text-[#b3b3b3]">OR</span>
            <div className="h-px flex-1 bg-[#2B2A29]" />
          </div>
          <button
            type="button"
            onClick={onOpenReceive}
            className="flex h-[52px] w-full items-center justify-center rounded-full border border-[#2B2A29] text-[16px] font-semibold tracking-[-0.16px] text-[#fcfcfc]"
          >
            Receive from another wallet
          </button>
        </div>
      </div>
    </div>
  )
}
