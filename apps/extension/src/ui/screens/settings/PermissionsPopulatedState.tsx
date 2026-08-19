import React, { useState } from 'react'

import type { SessionKeyPermission } from './permissions/types'
import { PermissionsHowItWorksModal } from './permissions/PermissionsHowItWorksModal'

function Pill({ label }: { label: string }) {
  return (
    <div className="flex h-6 items-center justify-center rounded-lg bg-[rgba(255,173,0,0.08)] px-2 py-1">
      <span className="text-[12px] font-medium tracking-[-0.12px] text-[#ffad00] leading-[1.3]">
        {label}
      </span>
    </div>
  )
}

export function PermissionsPopulatedState({ session }: { session: SessionKeyPermission }) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between">
      <div className="flex w-full flex-col gap-3">
        <div className="w-full rounded-[14px] bg-[#2b2a29] p-3">
          <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
            Session Keys &amp; dApps
          </p>
          <p className="mt-1.5 text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
            Active sessions with temporary permissions. Revoking a session immediately removes its
            access.
          </p>
          <button
            type="button"
            className="mt-2 text-[12px] font-normal leading-[1.34] tracking-[-0.24px] text-[#ffad00]"
            onClick={() => setHowItWorksOpen(true)}
          >
            Learn how permissions work
          </button>
        </div>

        <div className="w-full rounded-[14px] bg-[#2a2928] p-3">
          <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
            {session.name}
          </p>

          <div className="mt-2 flex items-start gap-2">
            {session.allowed.map((a) => (
              <Pill key={a} label={a} />
            ))}
          </div>

          <div className="mt-3 flex w-full gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
                Expires
              </p>
              <div className="w-full rounded-xl border border-[#383838] bg-[#2b2a29] px-3 py-3">
                <p className="text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
                  {session.duration}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
                Limit
              </p>
              <div className="flex w-full items-center justify-between rounded-xl border border-[#383838] bg-[#2b2a29] px-3 py-3">
                <p className="text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
                  {session.spendingLimitAmount}{' '}
                </p>
                <p className="text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#fcfcfc]">
                  {session.spendingLimitCurrency}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div />

      <PermissionsHowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />
    </div>
  )
}
