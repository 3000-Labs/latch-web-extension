import React from 'react'
import { ChevronLeft } from 'lucide-react'

export function SwapHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center justify-between shrink-0 h-12">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-full text-fg/70 hover:bg-surface/50 active:bg-surface/75 transition-all cursor-pointer"
        aria-label="Back"
      >
        <ChevronLeft className="h-5.5 w-5.5 text-white" strokeWidth={2.5} />
      </button>

      <div className="text-lg font-extrabold text-white">Swap</div>

      <div className="w-9" />
    </div>
  )
}
