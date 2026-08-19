import React, { useMemo, useState } from 'react'

import backIconUrl from 'url:../../../../assets/home/icon-back.svg'
import filterIconUrl from 'url:../../../../assets/home/icon-filter.svg'
import searchIconUrl from 'url:../../../../assets/home/icon-search.svg'

import { NewsCarousel } from '../../components/NewsCarousel'
import { MAIN_BOTTOM_NAV_CLEARANCE_PX } from '../home/components/MainBottomNav'
import { RecommendedDappCard } from './RecommendedDappCard'
import { RECOMMENDED_DAPPS } from './recommendedDapps'

export function ExploreScreen({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('')

  const filteredDapps = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return RECOMMENDED_DAPPS
    return RECOMMENDED_DAPPS.filter(
      (dapp) => dapp.name.toLowerCase().includes(q) || dapp.description.toLowerCase().includes(q)
    )
  }, [query])

  const openDapp = (url: string) => {
    void chrome.tabs.create({ url })
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col animate-screenIn"
      style={{ paddingBottom: MAIN_BOTTOM_NAV_CLEARANCE_PX }}
    >
      <div className="grid h-[22px] grid-cols-[20px_1fr_20px] items-center">
        <button type="button" onClick={onBack} className="h-5 w-5 shrink-0" aria-label="Back">
          <img src={backIconUrl} alt="" className="h-5 w-5" />
        </button>
        <p className="text-center text-sm font-medium tracking-[-0.14px] text-[#fbfbfb]">Explore</p>
        <div aria-hidden />
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-[34px] min-w-0 flex-1 items-center justify-between rounded-xl border border-stroke px-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for assets or dApps ..."
              className="w-full bg-transparent text-xs tracking-[-0.24px] text-fg outline-none placeholder:text-muted"
            />
            <img src={searchIconUrl} alt="" className="h-4 w-4 shrink-0" aria-hidden />
          </div>
          <button
            type="button"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-xl border border-stroke"
            aria-label="Filter"
          >
            <img src={filterIconUrl} alt="" className="h-[22px] w-[22px]" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto">
          <NewsCarousel className="w-full shrink-0 self-stretch" />

          <div className="flex w-full flex-col gap-4">
            <p className="text-sm leading-[1.34] tracking-[-0.28px] text-muted">
              Recommended dApps
            </p>
            <div className="flex flex-col gap-2">
              {filteredDapps.map((dapp) => (
                <RecommendedDappCard key={dapp.id} dapp={dapp} onOpen={openDapp} />
              ))}
              {filteredDapps.length === 0 ? (
                <p className="text-sm text-muted">No dApps match your search.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
