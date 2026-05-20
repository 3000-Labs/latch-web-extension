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
    <div className="mt-6 flex shrink-0 items-center justify-between gap-2 px-1">
      <p className="min-w-0 truncate text-[15px]">
        <span className="text-[#8E8E93]">To: </span>
        <span className="font-semibold text-white">{label}</span>
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="grid h-8 w-8 shrink-0 place-items-center text-[#8E8E93] hover:text-white"
        aria-label="Edit recipient"
      >
        <Pencil className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}
