import React from 'react'

import exploreIconUrl from 'url:../../../../../assets/home/nav-explore.svg'
import historyIconUrl from 'url:../../../../../assets/home/nav-history.svg'
import homeIconUrl from 'url:../../../../../assets/home/nav-home-active.svg'
import swapIconUrl from 'url:../../../../../assets/home/nav-swap.svg'

export type MainTab = 'home' | 'swap' | 'history' | 'explore'

const tabs: { id: MainTab; label: string; iconUrl: string }[] = [
  { id: 'home', label: 'Home', iconUrl: homeIconUrl },
  { id: 'swap', label: 'Swap', iconUrl: swapIconUrl },
  { id: 'history', label: 'History', iconUrl: historyIconUrl },
  { id: 'explore', label: 'Explore', iconUrl: exploreIconUrl },
]

export function MainBottomNav({
  active,
  onSelect,
}: {
  active: MainTab
  onSelect: (tab: MainTab) => void
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex h-[74px] items-center justify-between rounded-tl-[12px] rounded-tr-[12px] bg-[rgb(var(--latch-surface-2))] px-6 py-3">
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className="flex w-[52px] flex-col items-center gap-1"
          >
            <img src={tab.iconUrl} alt="" className="h-6 w-6" aria-hidden />
            <span
              className={[
                'text-sm tracking-[-0.28px]',
                isActive ? 'text-primary' : 'text-muted',
              ].join(' ')}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
