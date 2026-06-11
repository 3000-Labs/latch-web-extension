import React from 'react'

import userAvatarUrl from 'url:../../../../../assets/icons/user.png'
import chevronDownUrl from 'url:../../../../../assets/home/icon-chevron-down.svg'

export function HomeProfileButton({
  accountName,
  onClick,
}: {
  accountName: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-[18px] bg-surface-2 p-1.5"
      aria-label="Open profile settings"
    >
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
