import React, { useMemo, useState } from 'react'

import { SettingsScreenHeader } from './SettingsScreenHeader'
import { PermissionsProgressDots } from './permissions/PermissionsProgressDots'

export function CreateSessionKeyScreen({
  onBack,
  onContinue,
}: {
  onBack: () => void
  onContinue: (sessionName: string) => void
}) {
  const [sessionName, setSessionName] = useState('')
  const canContinue = useMemo(() => sessionName.trim().length > 0, [sessionName])

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      <SettingsScreenHeader
        title="Create Session Key"
        onBack={onBack}
        rightAction={<PermissionsProgressDots activeCount={1} />}
      />

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col gap-2">
          <div className="w-full rounded-[14px] bg-[#2a2928] p-3">
            <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
              What is a Session Key?
            </p>
            <p className="mt-1.5 text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
              Instead of giving an app full control, you create a temporary key that can only do
              exactly what you allow it to do. It automatically expires.
            </p>
          </div>

          <div className="flex w-full flex-col gap-1">
            <label
              htmlFor="session-name"
              className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]"
            >
              Session Name
            </label>
            <input
              id="session-name"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder=""
              className="h-[52px] w-full rounded-xl border border-[#383838] bg-transparent px-3 text-[16px] tracking-[-0.32px] text-[#fcfcfc] outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!canContinue}
          onClick={() => onContinue(sessionName.trim())}
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
