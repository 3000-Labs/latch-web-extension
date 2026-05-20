import React from 'react'
import { ChevronLeft } from 'lucide-react'

export function TransactionDetailHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center justify-between shrink-0 h-12">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-[#2C2C2E] transition-all cursor-pointer"
        aria-label="Back"
      >
        <ChevronLeft className="h-[20px] w-[20px]" strokeWidth={2.5} aria-hidden />
      </button>
      <div className="text-[17px] font-semibold text-white">Transaction Details</div>
      <div className="w-9" />
    </div>
  )
}
