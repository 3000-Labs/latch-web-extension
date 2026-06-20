import React, { useMemo } from 'react'

import { SettingsScreenHeader } from './SettingsScreenHeader'
import { PermissionsProgressDots } from './permissions/PermissionsProgressDots'
import type { SessionKeyDraft } from './permissions/types'

function Pill({ label }: { label: string }) {
  return (
    <div className="flex h-6 items-center justify-center rounded-lg bg-[rgba(255,173,0,0.08)] px-2 py-1">
      <span className="text-[12px] font-medium tracking-[-0.12px] text-[#ffad00] leading-[1.3]">
        {label}
      </span>
    </div>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex w-full items-center justify-between text-[12px]">
      <span className="font-normal leading-[1.34] tracking-[-0.24px] text-[#b3b3b3]">
        {label}
      </span>
      <span className="font-medium leading-[1.3] tracking-[-0.12px] text-[#fcfcfc]">
        {value}
      </span>
    </div>
  )
}

export function ReviewConfirmScreen({
  draft,
  onBack,
  onConfirm,
}: {
  draft: SessionKeyDraft
  onBack: () => void
  onConfirm: () => void
}) {
  const pills = useMemo(() => draft.allowed.map((a) => <Pill key={a} label={a} />), [draft.allowed])

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      <SettingsScreenHeader
        title="Review & Confirm"
        onBack={onBack}
        rightAction={<PermissionsProgressDots activeCount={3} />}
      />

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col gap-2">
          <div className="w-full rounded-[14px] bg-[#2a2928] p-3">
            <div className="flex w-full flex-col gap-3">
              <SummaryRow label="Session Name" value={draft.name} />
              <div className="h-px w-full bg-[#262626]" />
              <SummaryRow label="Duration" value={draft.duration} />
              <div className="h-px w-full bg-[#262626]" />
              <SummaryRow
                label="Spending Limit"
                value={
                  <>
                    <span className="font-normal">{draft.spendingLimitAmount}</span>
                    <span>{` ${draft.spendingLimitCurrency}`}</span>
                  </>
                }
              />
              <div className="h-px w-full bg-[#262626]" />
              <div className="flex w-full items-center justify-between">
                <span className="text-[12px] font-normal leading-[1.34] tracking-[-0.24px] text-[#b3b3b3]">
                  Allowed transactions
                </span>
                <div className="flex items-start gap-2">{pills}</div>
              </div>
            </div>
          </div>

          <div className="w-full rounded-[14px] bg-[rgba(234,71,30,0.08)] p-3">
            <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#ea471e]">
              Security Warning
            </p>
            <p className="mt-1.5 text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
              This session will be able to perform actions on your behalf without requiring your
              explicit approval each time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="relative h-12 w-full shrink-0 overflow-hidden rounded-[32px] border border-[#f0a300] px-5 py-3 text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[32px] bg-[#ffad00]"
          />
          <span className="relative">Confirm &amp; Create Key</span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
          />
        </button>
      </div>
    </div>
  )
}

