import React from 'react'

import chevronRightIconUrl from 'url:../../../../assets/home/icon-chevron-right.svg'

export function SendSummaryFactRow({
  label,
  value,
  showChevron,
}: {
  label: string
  value: React.ReactNode
  showChevron?: boolean
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <span className="shrink-0 text-xs font-normal leading-[1.34] tracking-[-0.24px] text-[#b3b3b3]">
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-1 text-right">
        <div className="min-w-0 text-xs font-medium leading-[1.3] tracking-[-0.12px] text-[#fcfcfc]">
          {value}
        </div>
        {showChevron ? (
          <img src={chevronRightIconUrl} alt="" className="size-4 shrink-0 opacity-60" aria-hidden />
        ) : null}
      </div>
    </div>
  )
}
