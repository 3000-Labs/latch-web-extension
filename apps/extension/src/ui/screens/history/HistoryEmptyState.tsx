import React from 'react'

import emptyStateMascotUrl from 'url:../../../../assets/avatars/empty-state-mascot.png'

export function HistoryEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-6">
      <img
        src={emptyStateMascotUrl}
        alt=""
        className="h-[140px] w-[140px] object-contain"
        aria-hidden
      />
      <h3 className="mt-6 text-xl font-extrabold text-fg">Empty History</h3>
      <p className="mt-2 text-center text-sm font-bold text-muted">Start by funding your account</p>
    </div>
  )
}
