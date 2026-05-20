import React from 'react'
import { ChevronLeft, QrCode } from 'lucide-react'

export function SelectTokenHeader({ onBack }: { onBack: () => void }) {
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
      <div className="text-base font-extrabold">Select Token</div>
      <button
        type="button"
        className="grid h-9 w-9 place-items-center text-fg/80 hover:text-fg"
        aria-label="Scan QR"
      >
        <QrCode className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>
    </div>
  )
}
