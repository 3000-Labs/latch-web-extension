import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

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
export const MAIN_BOTTOM_NAV_CLEARANCE_PX = 69

const ACTIVE_PILL_WIDTH_PX = 62
const ACTIVE_PILL_HEIGHT_PX = 41

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
  const navRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<Partial<Record<MainTab, HTMLButtonElement>>>({})
  const [indicatorX, setIndicatorX] = useState<number | null>(null)
  const [wobbleKey, setWobbleKey] = useState(0)
  const prevActiveRef = useRef(active)

  const updateIndicatorPosition = useCallback(() => {
    const nav = navRef.current
    const activeButton = tabRefs.current[active]
    if (!nav || !activeButton) return

    const navRect = nav.getBoundingClientRect()
    const buttonRect = activeButton.getBoundingClientRect()
    const centerX = buttonRect.left - navRect.left + buttonRect.width / 2
    const x = centerX - ACTIVE_PILL_WIDTH_PX / 2

    const paddingLeft = Number.parseFloat(getComputedStyle(nav).paddingLeft) || 0
    const paddingRight = Number.parseFloat(getComputedStyle(nav).paddingRight) || 0
    const minX = paddingLeft
    const maxX = navRect.width - paddingRight - ACTIVE_PILL_WIDTH_PX
    setIndicatorX(Math.max(minX, Math.min(x, maxX)))
  }, [active])

  useLayoutEffect(() => {
    updateIndicatorPosition()
  }, [updateIndicatorPosition])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const resizeObserver = new ResizeObserver(() => {
      updateIndicatorPosition()
    })
    resizeObserver.observe(nav)
    window.addEventListener('resize', updateIndicatorPosition)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateIndicatorPosition)
    }
  }, [updateIndicatorPosition])

  useEffect(() => {
    if (prevActiveRef.current === active) return
    prevActiveRef.current = active
    setWobbleKey((key) => key + 1)
  }, [active])

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 flex justify-center px-6 pb-3">
      <nav
        ref={navRef}
        aria-label="Main navigation"
        className="pointer-events-auto relative grid w-full max-w-[378px] grid-cols-4 rounded-[34px] bg-[#303030] p-2"
      >
        <div
          aria-hidden
          className={[
            'latch-nav-active-pill pointer-events-none absolute left-0 top-2 rounded-[22px]',
            indicatorX === null ? 'opacity-0' : 'opacity-100',
          ].join(' ')}
          style={{
            width: ACTIVE_PILL_WIDTH_PX,
            height: ACTIVE_PILL_HEIGHT_PX,
            transform: `translate3d(${indicatorX ?? 0}px, 0, 0)`,
            transition: 'transform 380ms cubic-bezier(0.4, 0, 0.2, 1), opacity 120ms ease-out',
          }}
        />

        {tabs.map((tab) => {
          const isActive = tab.id === active
          const iconSrc = isActive ? tab.activeIconUrl : tab.iconUrl

          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) tabRefs.current[tab.id] = node
                else delete tabRefs.current[tab.id]
              }}
              type="button"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(tab.id)}
              className="relative z-10 flex h-[41px] w-full items-center justify-center"
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
            </button>
          )
        })}
      </nav>
    </div>
  )
}
