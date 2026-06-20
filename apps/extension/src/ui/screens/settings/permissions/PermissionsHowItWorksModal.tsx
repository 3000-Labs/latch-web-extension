import React from 'react'
import { createPortal } from 'react-dom'

import closeMiniUrl from 'url:../../../../../assets/permissions/close-mini.svg'

export function PermissionsHowItWorksModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#121212]/90"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-[354px] rounded-[18px] bg-[#222121] px-3 py-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="permissions-how-it-works-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <h2
              id="permissions-how-it-works-title"
              className="min-w-0 flex-1 text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]"
            >
              How permissions work
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex size-5 shrink-0 items-center justify-center"
              aria-label="Close"
            >
              <img src={closeMiniUrl} alt="" className="size-2.5" aria-hidden />
            </button>
          </div>

          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-col gap-1.5">
              <p className="text-[12px] font-medium leading-[1.3] tracking-[-0.12px] text-white">
                Temporary Keys
              </p>
              <p className="text-[12px] font-normal leading-[1.34] tracking-[-0.24px] text-[#b3b3b3]">
                When you connect an app, Latch creates a temporary Session Key that can act on your
                behalf.
              </p>
            </div>

            <div className="flex w-full flex-col gap-1.5">
              <p className="text-[12px] font-medium leading-[1.3] tracking-[-0.12px] text-white">
                Strict Limits
              </p>
              <p className="text-[12px] font-normal leading-[1.34] tracking-[-0.24px] text-[#b3b3b3]">
                These keys cannot transfer your full balance or change settings. They are strictly
                bound to limits you approve.
              </p>
            </div>

            <div className="flex w-full flex-col gap-1.5">
              <p className="text-[12px] font-medium leading-[1.3] tracking-[-0.12px] text-white">
                Auto-Expiration
              </p>
              <p className="text-[12px] font-normal leading-[1.34] tracking-[-0.24px] text-[#b3b3b3]">
                You never have to reowner to disconnect. Sessions expire automatically and revoke
                themselves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

