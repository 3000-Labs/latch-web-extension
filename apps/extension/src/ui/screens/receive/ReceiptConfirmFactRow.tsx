import React from 'react'

export function ReceiptConfirmFactRow({
  label,
  value,
  valueClassName = 'text-fg',
}: {
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex justify-between items-center py-3 text-sm">
      <span className="text-muted font-bold">{label}</span>
      <span
        className={['font-extrabold text-right truncate pl-4 max-w-[240px]', valueClassName].join(
          ' '
        )}
      >
        {value}
      </span>
    </div>
  )
}
