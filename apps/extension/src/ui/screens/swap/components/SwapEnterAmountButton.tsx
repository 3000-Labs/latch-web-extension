import React from 'react'

export function SwapEnterAmountButton({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'relative h-12 w-full rounded-[32px] border px-5 py-3 text-base font-semibold tracking-[-0.16px] transition-all',
        disabled
          ? 'cursor-not-allowed border-border bg-stroke text-[#d7d7d7] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)]'
          : 'cursor-pointer border-[#f0a300] bg-primary text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)] hover:brightness-105 active:scale-[0.98]',
      ].join(' ')}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
      />
      {label}
    </button>
  )
}
