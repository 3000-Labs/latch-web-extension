import React, { useMemo, useState } from 'react'

import checkOffUrl from 'url:../../../../assets/permissions/check-off.svg'
import checkOnEllipseUrl from 'url:../../../../assets/permissions/check-on-ellipse.svg'
import checkOnPathUrl from 'url:../../../../assets/permissions/check-on-path.svg'
import { SettingsScreenHeader } from './SettingsScreenHeader'
import { PermissionsProgressDots } from './permissions/PermissionsProgressDots'

type DurationOption = '1hour' | '1day' | '1week' | '1month'
type AllowedAction = 'transfer' | 'swap' | 'offers'

function DurationButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#2a2928] p-3',
        selected ? 'border border-[#f0a300]' : 'border border-transparent',
      ].join(' ')}
    >
      <span className="text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
        {label}
      </span>
    </button>
  )
}

function ActionCheck({ checked }: { checked: boolean }) {
  if (!checked) {
    return <img src={checkOffUrl} alt="" className="size-4 shrink-0" aria-hidden />
  }

  return (
    <span className="relative size-4 shrink-0" aria-hidden>
      <img src={checkOnEllipseUrl} alt="" className="absolute inset-0 size-full" />
      <span className="absolute inset-[35.71%_35.71%_35.71%_28.57%]">
        <img src={checkOnPathUrl} alt="" className="block size-full" />
      </span>
    </span>
  )
}

function AllowedActionRow({
  title,
  subtitle,
  checked,
  onToggle,
}: {
  title: string
  subtitle: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-[14px] bg-[#2a2928] p-3 text-left"
    >
      <ActionCheck checked={checked} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
          {title}
        </p>
        <p className="text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
          {subtitle}
        </p>
      </div>
    </button>
  )
}

export function SetLimitsScreen({
  onBack,
  onContinue,
}: {
  onBack: () => void
  onContinue: (result: {
    duration: '1 Hour' | '1 Day' | '1 Week' | '1 Month'
    spendingLimitAmount: string
    spendingLimitCurrency: 'USDC'
    allowed: Array<'Transfer' | 'Swap' | 'Offers'>
  }) => void
}) {
  const [duration, setDuration] = useState<DurationOption | null>(null)
  const [limit, setLimit] = useState('')
  const [allowed, setAllowed] = useState<Record<AllowedAction, boolean>>({
    transfer: false,
    swap: false,
    offers: false,
  })

  const canContinue = useMemo(() => {
    if (!duration) return false
    const numeric = Number(limit.replace(/,/g, ''))
    if (!Number.isFinite(numeric) || numeric <= 0) return false
    return Object.values(allowed).some(Boolean)
  }, [allowed, duration, limit])

  const durationLabel: '1 Hour' | '1 Day' | '1 Week' | '1 Month' | null =
    duration === '1hour'
      ? '1 Hour'
      : duration === '1day'
        ? '1 Day'
        : duration === '1week'
          ? '1 Week'
          : duration === '1month'
            ? '1 Month'
            : null

  const allowedLabels: Array<'Transfer' | 'Swap' | 'Offers'> = [
    allowed.transfer ? 'Transfer' : null,
    allowed.swap ? 'Swap' : null,
    allowed.offers ? 'Offers' : null,
  ].filter((x): x is 'Transfer' | 'Swap' | 'Offers' => x != null)

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      <SettingsScreenHeader
        title="Set Limits"
        onBack={onBack}
        rightAction={<PermissionsProgressDots activeCount={2} />}
      />

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-6">
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full flex-col gap-1">
            <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
              Duration
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <div className="grid w-full grid-cols-2 gap-2">
              <DurationButton
                label="1 Hour"
                selected={duration === '1hour'}
                onClick={() => setDuration('1hour')}
              />
              <DurationButton
                label="1 Day"
                selected={duration === '1day'}
                onClick={() => setDuration('1day')}
              />
            </div>
            <div className="grid w-full grid-cols-2 gap-2">
              <DurationButton
                label="1 Week"
                selected={duration === '1week'}
                onClick={() => setDuration('1week')}
              />
              <DurationButton
                label="1 Month"
                selected={duration === '1month'}
                onClick={() => setDuration('1month')}
              />
            </div>
          </div>

          <div className="mt-1 flex w-full flex-col gap-1">
            <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
              Total Spending Limit
            </p>
            <div className="flex h-[52px] w-full items-center justify-between rounded-xl border border-[#383838] px-3">
              <input
                type="text"
                inputMode="decimal"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent text-[16px] tracking-[-0.32px] text-[#fcfcfc] placeholder:text-[#b3b3b3] outline-none"
              />
              <div className="shrink-0 rounded-xl bg-[#222121] px-2 py-2">
                <span className="text-center text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#fcfcfc]">
                  USDC
                </span>
              </div>
            </div>
          </div>

          <div className="mt-1 flex w-full flex-col gap-3">
            <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
              Allowed Actions
            </p>

            <div className="flex w-full flex-col gap-3">
              <AllowedActionRow
                title="Transfer Tokens"
                subtitle="Allow sending funds within limit"
                checked={allowed.transfer}
                onToggle={() => setAllowed((s) => ({ ...s, transfer: !s.transfer }))}
              />
              <AllowedActionRow
                title="Swap Tokens"
                subtitle="Allow trading tokens on DEX"
                checked={allowed.swap}
                onToggle={() => setAllowed((s) => ({ ...s, swap: !s.swap }))}
              />
              <AllowedActionRow
                title="Manage Offers"
                subtitle="Create or cancel trade offers"
                checked={allowed.offers}
                onToggle={() => setAllowed((s) => ({ ...s, offers: !s.offers }))}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!canContinue}
          onClick={() => {
            if (!canContinue || !durationLabel) return
            onContinue({
              duration: durationLabel,
              spendingLimitAmount: limit.trim(),
              spendingLimitCurrency: 'USDC',
              allowed: allowedLabels,
            })
          }}
          className={[
            'relative h-12 w-full shrink-0 overflow-hidden rounded-[32px] border px-5 py-3 text-[16px] font-semibold leading-[1.31] tracking-[-0.16px]',
            canContinue
              ? 'border-[#f0a300] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)]'
              : 'border-[#2b2a29] text-[#d7d7d7] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)]',
          ].join(' ')}
        >
          <span
            aria-hidden
            className={[
              'pointer-events-none absolute inset-0 rounded-[32px]',
              canContinue ? 'bg-[#ffad00]' : 'bg-[#383838]',
            ].join(' ')}
          />
          <span className="relative">Continue</span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
          />
        </button>
      </div>
    </div>
  )
}

