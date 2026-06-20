import React from 'react'

import backIconUrl from 'url:../../../../assets/home/icon-back.svg'

export function SelectTokenHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="grid h-[22px] shrink-0 grid-cols-[20px_1fr_20px] items-center">
      <button type="button" onClick={onBack} className="size-5 shrink-0" aria-label="Back">
        <img src={backIconUrl} alt="" className="size-5" aria-hidden />
      </button>
      <p className="text-center text-sm font-medium tracking-[-0.14px] text-[#fbfbfb]">Select Token</p>
      <div aria-hidden />
    </div>
  )
}
