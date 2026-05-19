import React from 'react'
import { ChevronLeft } from 'lucide-react'

export function SendEnterAmountHeader({
  title,
  canContinue,
  onBack,
  onNext,
}: {
  title: string
  canContinue: boolean
  onBack: () => void
  onNext: () => void
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
      <button
        type="button"
        disabled={!canContinue}
        onClick={onNext}
        className="text-sm font-extrabold text-fg/50 disabled:opacity-40 enabled:text-fg/90 enabled:hover:text-fg"
      >
        Next
      </button>
    </div>
  )
}
