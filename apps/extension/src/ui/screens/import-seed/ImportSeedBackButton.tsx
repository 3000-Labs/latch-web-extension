import React from 'react'
import { ChevronLeft } from 'lucide-react'

export function ImportSeedBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="grid h-9 w-9 place-items-center text-fg/90 hover:text-fg"
      aria-label="Back"
    >
      <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={2} aria-hidden />
    </button>
  )
}
