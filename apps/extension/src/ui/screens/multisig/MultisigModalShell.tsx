import React from 'react'
import { createPortal } from 'react-dom'

import closeIconUrl from 'url:../../../../assets/home/icon-close.svg'

export function MultisigModalShell({
  isOpen,
  title,
  titleClassName = 'text-xl font-semibold leading-[1.31] tracking-[-0.4px] text-[#fcfcfc]',
  onClose,
  children,
}: {
  isOpen: boolean
  title: string
  titleClassName?: string
  onClose: () => void
  children: React.ReactNode
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
        className="relative z-10 w-full max-w-[372px] rounded-[18px] bg-[#222121] px-3 py-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="multisig-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <h2 id="multisig-modal-title" className={['min-w-0 flex-1', titleClassName].join(' ')}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="relative size-5 shrink-0"
              aria-label="Close"
            >
              <img
                src={closeIconUrl}
                alt=""
                className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2"
              />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
