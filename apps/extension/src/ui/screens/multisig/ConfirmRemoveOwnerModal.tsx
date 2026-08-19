import React from 'react'
import { createPortal } from 'react-dom'

export function ConfirmRemoveOwnerModal({
  isOpen,
  walletName,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean
  walletName: string
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!isOpen) return null

  const displayName = walletName.trim() || 'Latch'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#121212]/90"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        className="relative z-10 w-full max-w-[372px] rounded-[18px] bg-[#2e2e2e] px-3 py-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-owner-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-col gap-2 text-center">
            <h2
              id="remove-owner-modal-title"
              className="text-xl font-semibold leading-[1.31] tracking-[-0.4px] text-[#fcfcfc]"
            >
              Remove Owner
            </h2>
            <p className="text-base leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
              Are you sure you want to remove this owner from{' '}
              <span className="font-bold text-[#fcfcfc]">{displayName}</span>?
            </p>
          </div>
          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="relative flex h-11 flex-1 items-center justify-center overflow-hidden rounded-[32px] border border-[#2b2a29] bg-[#383838] px-5 text-sm font-medium tracking-[-0.14px] text-[#d7d7d7] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)]"
            >
              No, Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="relative flex h-11 flex-1 items-center justify-center overflow-hidden rounded-[32px] border border-[#e23a10] bg-[#ea471e] px-5 text-sm font-medium tracking-[-0.14px] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)]"
            >
              Yes, Go Ahead
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
