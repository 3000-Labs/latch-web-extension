import React from 'react'

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full border px-4 py-1.5 text-xs font-extrabold transition-all',
        active
          ? 'border-primary text-fg bg-surface/20'
          : 'border-border/60 text-muted/70 hover:bg-surface/50 hover:text-fg',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
