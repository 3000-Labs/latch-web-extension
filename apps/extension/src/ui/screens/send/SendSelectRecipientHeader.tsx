import React from 'react'
import { ChevronLeft } from 'lucide-react'

export function SendSelectRecipientHeader({
  title,
  onBack,
}: {
  title: string
  onBack: () => void
}) {
  return (
    <div className="flex shrink-0 items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="grid h-9 w-9 place-items-center text-fg/80 hover:text-fg"
        aria-label="Back"
      >
        <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </button>
      <div className="text-base font-extrabold">{title}</div>
      <div className="w-9" />
    </div>
  )
}
