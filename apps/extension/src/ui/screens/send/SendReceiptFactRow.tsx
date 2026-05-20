import React from 'react'

export function SendReceiptFactRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="shrink-0 text-sm font-bold text-muted">{label}</div>
      <div
        className={[
          'max-w-[60%] break-all text-right text-sm font-extrabold text-fg',
          valueClassName ?? '',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  )
}
