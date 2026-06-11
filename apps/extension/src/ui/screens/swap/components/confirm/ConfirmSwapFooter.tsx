import React from 'react'

export function ConfirmSwapFooter({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="grid w-full shrink-0 grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="relative h-12 rounded-[32px] border border-[#2b2a29] bg-[#121212] text-base font-semibold tracking-[-0.16px] text-[#b3b3b3] shadow-[0px_12px_13.1px_-8px_rgba(21,19,17,0.1)] transition-all hover:brightness-110 active:scale-[0.98]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
        />
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="relative h-12 rounded-[32px] border border-[#f0a300] bg-primary text-base font-semibold tracking-[-0.16px] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)] transition-all hover:brightness-105 active:scale-[0.98]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
        />
        Confirm Swap
      </button>
    </div>
  )
}
