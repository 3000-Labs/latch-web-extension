import React from 'react'
import { Pencil } from 'lucide-react'

import { truncateMiddle } from '../../lib/sendAddress'

export function SendRecipientBar({
  recipientName,
  recipientAddress,
  onEdit,
}: {
  recipientName?: string
  recipientAddress: string
  onEdit: () => void
}) {
  const label = recipientName
    ? `${recipientName} {${truncateMiddle(recipientAddress)}}`
    : `{${truncateMiddle(recipientAddress)}}`

  return (
    <div className="mt-4 flex shrink-0 items-center justify-between gap-2">
      <p className="min-w-0 truncate text-sm">
        <span className="font-bold text-muted">To: </span>
        <span className="font-extrabold text-fg">{label}</span>
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="grid h-8 w-8 shrink-0 place-items-center text-fg/60 hover:text-fg"
        aria-label="Edit recipient"
      >
        <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}
