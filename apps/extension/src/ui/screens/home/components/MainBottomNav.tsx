import React, { useEffect, useRef, useState } from 'react'

import exploreActiveIconUrl from 'url:../../../../../assets/home/nav-explore-active.svg'
import exploreIconUrl from 'url:../../../../../assets/home/nav-explore.svg'
import historyActiveIconUrl from 'url:../../../../../assets/home/nav-history-active.svg'
import historyIconUrl from 'url:../../../../../assets/home/nav-history.svg'
import homeActiveIconUrl from 'url:../../../../../assets/home/nav-home-active.svg'
import homeIconUrl from 'url:../../../../../assets/home/nav-home.svg'
import swapActiveIconUrl from 'url:../../../../../assets/home/nav-swap-active.svg'
import swapIconUrl from 'url:../../../../../assets/home/nav-swap.svg'

export type MainTab = 'home' | 'swap' | 'history' | 'explore'

/** Bottom clearance for main tab scroll areas (floating pill nav + wrapper padding). */
export const MAIN_BOTTOM_NAV_CLEARANCE_PX = 83

const tabs: { id: MainTab; label: string; iconUrl: string; activeIconUrl: string }[] = [
  { id: 'home', label: 'Home', iconUrl: homeIconUrl, activeIconUrl: homeActiveIconUrl },
  { id: 'swap', label: 'Swap', iconUrl: swapIconUrl, activeIconUrl: swapActiveIconUrl },
  { id: 'history', label: 'History', iconUrl: historyIconUrl, activeIconUrl: historyActiveIconUrl },
  { id: 'explore', label: 'Explore', iconUrl: exploreIconUrl, activeIconUrl: exploreActiveIconUrl },
]

export function MainBottomNav({
  active,
  onSelect,
}: {
  active: MainTab
  onSelect: (tab: MainTab) => void
}) {
  const [wobbleKey, setWobbleKey] = useState(0)
  const prevActiveRef = useRef(active)

  useEffect(() => {
    if (prevActiveRef.current === active) return
    prevActiveRef.current = active
    setWobbleKey((key) => key + 1)
  }, [active])

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 flex justify-center px-6 pb-3">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto flex w-full max-w-[378px] items-center justify-between rounded-[34px] bg-[#303030] px-6 py-3"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active
          const iconSrc = isActive ? tab.activeIconUrl : tab.iconUrl

          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(tab.id)}
              className="flex w-[52px] flex-col items-center gap-1"
            >
              <span
                key={isActive ? `${tab.id}-wobble-${wobbleKey}` : tab.id}
                className={[
                  'flex h-6 w-6 items-center justify-center',
                  isActive && wobbleKey > 0 ? 'latch-nav-icon-wobble' : '',
                ].join(' ')}
              >
                <img src={iconSrc} alt="" className="h-6 w-6" aria-hidden />
              </span>
              <span
                className={[
                  'text-sm leading-[1.34] tracking-[-0.28px] transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted',
                ].join(' ')}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
