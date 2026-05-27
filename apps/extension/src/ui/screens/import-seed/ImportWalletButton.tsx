import React from 'react'

export function ImportWalletButton({
  disabled,
  onClick,
}: {
  disabled?: boolean
  onClick: () => void
}) {
  const isDisabled = Boolean(disabled)
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'h-12 w-full rounded-full border border-border text-base font-bold shadow-soft',
        isDisabled ? 'bg-surface text-fg hover:bg-surface/80' : 'bg-primary text-black hover:bg-primary/80',
        'disabled:cursor-not-allowed disabled:opacity-50',
      ].join(' ')}
    >
      Import Wallet
    </button>
  )
}
