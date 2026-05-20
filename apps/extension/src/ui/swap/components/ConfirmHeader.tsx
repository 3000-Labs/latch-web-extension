import React from 'react'
import { ChevronLeft } from 'lucide-react'

export function ConfirmHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center justify-between shrink-0 h-12">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-full text-fg/70 hover:bg-surface/50 active:bg-surface/75 transition-all"
        aria-label="Back"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
      </button>

      <div className="text-base font-extrabold text-fg">Confirm Swap</div>

      <div className="w-9" />
    </div>
  )
}
