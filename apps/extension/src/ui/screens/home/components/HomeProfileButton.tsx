import React from 'react'

import userAvatarUrl from 'url:../../../../../assets/icons/user.png'
import chevronDownUrl from 'url:../../../../../assets/home/icon-chevron-down.svg'

export function HomeProfileButton({
  accountName,
  onClick,
  showPendingDot,
}: {
  accountName: string
  onClick: () => void
  showPendingDot?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center gap-1 rounded-[18px] bg-surface-2 p-1.5"
      aria-label="Open profile settings"
    >
      {showPendingDot ? (
        <span className="pointer-events-none absolute right-0 top-0 translate-x-1/3 -translate-y-1/3">
          <span aria-hidden className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulseDot" />
        </span>
      ) : null}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <span className="text-sm font-medium tracking-[-0.14px] text-fg">{accountName}</span>
      </div>
      <img src={chevronDownUrl} alt="" className="h-5 w-5 shrink-0" aria-hidden />
    </button>
  )
}
