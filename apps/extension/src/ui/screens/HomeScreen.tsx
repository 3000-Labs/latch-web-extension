import React, { useMemo, useState } from 'react'

import searchIconUrl from 'url:../../../assets/home/icon-search.svg'

import { NewsCarousel } from '../components/NewsCarousel'
import type { HistoryItemVm } from '../types/history'
import { HomeActionButtons } from './home/components/HomeActionButtons'
import { HomeBalanceOverview } from './home/components/HomeBalanceOverview'
import { HomeProfileButton } from './home/components/HomeProfileButton'
import { HomeRecentActivity } from './home/components/HomeRecentActivity'
import { MAIN_BOTTOM_NAV_CLEARANCE_PX } from './home/components/MainBottomNav'

export function HomeScreen({
  accountName,
  onOpenSettings,
  onOpenExplore,
  onOpenHistory,
  onOpenSend,
  onOpenReceive,
  onOpenSwap,
  onOpenFund,
  onSelectActivity,
  recentActivity,
  totalBalanceUsd,
  balanceChangePercent,
}: {
  accountName: string
  onOpenSettings: () => void
  onOpenExplore: () => void
  onOpenHistory: () => void
  onOpenSend?: () => void
  onOpenReceive?: () => void
  onOpenSwap: () => void
  onOpenFund?: () => void
  onSelectActivity?: (item: HistoryItemVm) => void
  recentActivity: HistoryItemVm[]
  totalBalanceUsd?: string | null
  balanceChangePercent?: string | null
}) {
  const [hidden, setHidden] = useState(false)

  const recentItems = useMemo(() => recentActivity.slice(0, 4), [recentActivity])

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-[21px] overflow-auto"
      style={{ paddingBottom: MAIN_BOTTOM_NAV_CLEARANCE_PX }}
    >
      <div className="flex items-center justify-between">
        <HomeProfileButton accountName={accountName} onClick={onOpenSettings} />
        <button
          type="button"
          onClick={onOpenExplore}
          className="h-5 w-5 shrink-0"
          aria-label="Explore"
        >
          <img src={searchIconUrl} alt="" className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-[21px]">
        <div className="flex justify-center">
          <HomeBalanceOverview
            totalBalanceUsd={totalBalanceUsd}
            changePercent={balanceChangePercent}
            hidden={hidden}
            onToggleHidden={() => setHidden((v) => !v)}
          />
        </div>

        <HomeActionButtons
          onFund={onOpenFund ?? onOpenReceive}
          onSend={onOpenSend}
          onReceive={onOpenReceive}
          onSwap={onOpenSwap}
        />

        <NewsCarousel className="w-full self-stretch" />

        <HomeRecentActivity
          items={recentItems}
          onViewAll={onOpenHistory}
          onSelectItem={onSelectActivity}
        />
      </div>
    </div>
  )
}
