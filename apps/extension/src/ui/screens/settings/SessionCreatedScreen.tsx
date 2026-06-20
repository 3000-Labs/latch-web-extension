import React from 'react'

import successIllustrationUrl from 'url:../../../../assets/permissions/session-success-illustration.svg'

import { SettingsScreenHeader } from './SettingsScreenHeader'
import type { SessionKeyDraft } from './permissions/types'

export function SessionCreatedScreen({
  draft,
  onBack,
  onContinue,
}: {
  draft: SessionKeyDraft
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      <SettingsScreenHeader title="" onBack={onBack} />

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <div className="flex w-full flex-col items-center gap-[30px]">
            <img
              src={successIllustrationUrl}
              alt=""
              className="h-[217.801px] w-[242.001px] shrink-0 object-contain"
              width={242}
              height={218}
              draggable={false}
            />

            <div className="flex w-full flex-col items-center gap-3 text-center">
              <div className="flex w-full flex-col items-center gap-2 text-center">
                <h2 className="w-full text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
                  Session Created!
                </h2>
                <p className="w-full text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#b3b3b3]">
                  <span className="font-semibold text-[#b3b3b3]">{`The session key for `}</span>
                  <span className="font-semibold text-[#fcfcfc]">{draft.name}</span>
                  <span className="font-semibold text-[#b3b3b3]">{` is now active. It will automatically expire in ${draft.duration.toLowerCase()}.`}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="relative h-12 w-full shrink-0 overflow-hidden rounded-[32px] border border-[#f0a300] px-5 py-3 text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)]"
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[32px] bg-[#ffad00]" />
          <span className="relative">New Permissions</span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
          />
        </button>
      </div>
    </div>
  )
}

