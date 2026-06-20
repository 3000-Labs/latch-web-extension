import React from 'react'

import backIconUrl from 'url:../../../../assets/home/icon-back.svg'

export function SendSummaryHeader({
  onBack,
  disabled,
}: {
  onBack: () => void
  disabled?: boolean
}) {
  return (
    <div className="grid h-[22px] shrink-0 grid-cols-[20px_1fr_20px] items-center">
      <button
        type="button"
        onClick={onBack}
        disabled={disabled}
        className="size-5 shrink-0 disabled:opacity-40"
        aria-label="Back"
      >
        <img src={backIconUrl} alt="" className="size-5" aria-hidden />
      </button>
      <p className="text-center text-sm font-medium tracking-[-0.14px] text-[#fbfbfb]">Summary</p>
      <div aria-hidden />
    </div>
  )
}
