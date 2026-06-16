import React from 'react'

import backIconUrl from 'url:../../../../assets/home/icon-back.svg'

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
    <div className="grid h-[22px] shrink-0 grid-cols-[20px_1fr_auto] items-center gap-2">
      <button type="button" onClick={onBack} className="size-5 shrink-0" aria-label="Back">
        <img src={backIconUrl} alt="" className="size-5" aria-hidden />
      </button>
      <p className="text-center text-sm font-medium tracking-[-0.14px] text-[#fbfbfb]">{title}</p>
      <button
        type="button"
        disabled={!canContinue}
        onClick={onNext}
        className={[
          'shrink-0 text-sm font-medium tracking-[-0.14px]',
          canContinue ? 'text-primary' : 'text-[#b3b3b3]',
        ].join(' ')}
      >
        Next
      </button>
    </div>
  )
}
