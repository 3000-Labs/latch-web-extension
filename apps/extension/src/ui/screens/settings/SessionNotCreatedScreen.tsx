import React from 'react'

import failureIllustrationUrl from 'url:../../../../assets/permissions/session-failure-illustration.svg'

import { SettingsScreenHeader } from './SettingsScreenHeader'
import type { SessionKeyDraft } from './permissions/types'

export function SessionNotCreatedScreen({
  draft,
  onBack,
  onTryAgain,
}: {
  draft: SessionKeyDraft
  onBack: () => void
  onTryAgain: () => void
}) {
  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      <SettingsScreenHeader title="" onBack={onBack} />

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <div className="flex w-full flex-col items-center gap-[30px]">
            <img
              src={failureIllustrationUrl}
              alt=""
              className="h-[212.399px] w-[235.999px] shrink-0 object-contain"
              width={236}
              height={212}
              draggable={false}
            />

            <div className="flex w-full flex-col items-center gap-2 text-center">
              <h2 className="w-full text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
                Session Not Created!
              </h2>
              <p className="w-full text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
                <span>{`Could not create a session key for `}</span>
                <span className="font-bold text-[#fcfcfc]">{draft.name}</span>
                <span>. </span>
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTryAgain}
          className="relative h-12 w-full shrink-0 overflow-hidden rounded-[32px] border border-[#f0a300] px-5 py-3 text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)]"
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[32px] bg-[#ffad00]" />
          <span className="relative">Try Again</span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
          />
        </button>
      </div>
    </div>
  )
}

