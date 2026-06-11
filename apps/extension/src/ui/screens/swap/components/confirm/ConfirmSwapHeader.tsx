import React from 'react'

import backIconUrl from 'url:../../../../../../assets/home/icon-back.svg'

export function ConfirmSwapHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="grid h-[22px] shrink-0 grid-cols-[20px_1fr_20px] items-center">
      <button type="button" onClick={onBack} className="h-5 w-5 shrink-0" aria-label="Back">
        <img src={backIconUrl} alt="" className="h-5 w-5" aria-hidden />
      </button>
      <p className="text-center text-sm font-medium tracking-[-0.14px] text-[#fbfbfb]">
        Confirm Swap
      </p>
      <div aria-hidden />
    </div>
  )
}
