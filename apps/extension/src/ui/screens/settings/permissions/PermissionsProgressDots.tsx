import React from 'react'

import dotUrl from 'url:../../../../../assets/permissions/progress-dot.svg'

export function PermissionsProgressDots({ activeCount }: { activeCount: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0.5">
      <div className={activeCount >= 1 ? 'opacity-100' : 'opacity-40'}>
        <img src={dotUrl} alt="" className="h-[10px] w-[14px]" aria-hidden />
      </div>
      <div className={activeCount >= 2 ? 'opacity-100' : 'opacity-40'}>
        <img src={dotUrl} alt="" className="h-[10px] w-[14px]" aria-hidden />
      </div>
      <div className={activeCount >= 3 ? 'opacity-100' : 'opacity-40'}>
        <img src={dotUrl} alt="" className="h-[10px] w-[14px]" aria-hidden />
      </div>
    </div>
  )
}
