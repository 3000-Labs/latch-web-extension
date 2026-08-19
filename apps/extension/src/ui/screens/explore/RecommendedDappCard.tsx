import React from 'react'

import type { RecommendedDapp } from './recommendedDapps'

export function RecommendedDappCard({
  dapp,
  onOpen,
}: {
  dapp: RecommendedDapp
  onOpen: (url: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(dapp.url)}
      className="flex w-full items-center rounded-[14px] bg-[#302e2d] p-3 text-left"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#302813] p-1">
          <img src={dapp.iconUrl} alt="" className="size-6 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-[1.31] tracking-[-0.16px] text-fg">
            {dapp.name}
          </p>
          <p className="text-sm leading-[1.34] tracking-[-0.28px] text-muted">{dapp.description}</p>
        </div>
        <span className="shrink-0 text-sm font-medium leading-[1.3] tracking-[-0.14px] text-primary">
          Open
        </span>
      </div>
    </button>
  )
}
