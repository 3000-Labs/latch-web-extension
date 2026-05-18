import React from 'react'

export function ImportWalletButton({
  disabled,
  onClick,
}: {
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft',
        'hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-50',
      ].join(' ')}
    >
      Import Wallet
    </button>
  )
}
