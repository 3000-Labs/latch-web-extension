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
        className="grid h-9 w-9 place-items-center text-white hover:text-white/80"
        aria-label="Back"
      >
        <ChevronLeft className="h-[20px] w-[20px]" strokeWidth={2.5} aria-hidden />
      </button>
      <div className="text-[17px] font-semibold text-white">{title}</div>
      <button
        type="button"
        disabled={!canContinue}
        onClick={onNext}
        className="text-[15px] font-semibold text-[#8E8E93] disabled:opacity-50 enabled:text-[#8E8E93] enabled:hover:text-white"
      >
        Next
      </button>
    </div>
  )
}
