import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import dismissIconUrl from 'url:../../../assets/news/icon-dismiss.svg'
import slideMultisigUrl from 'url:../../../assets/news/slide-multisig.png'
import slideSessionKeysUrl from 'url:../../../assets/news/slide-session-keys.png'
import slideSmartAccountsUrl from 'url:../../../assets/news/slide-smart-accounts.png'
import slideSwapUrl from 'url:../../../assets/news/slide-swap.png'

const AUTOPLAY_MS = 4000
const DISMISSED_STORAGE_KEY = 'latch.newsDismissedSlideIds'
const SWIPE_THRESHOLD_PX = 40

type NewsSlideId = 'smart-accounts' | 'swap' | 'multisig' | 'session-keys'

type NewsSlideDef = {
  id: NewsSlideId
  src: string
  alt: string
}

const ALL_SLIDES: NewsSlideDef[] = [
  {
    id: 'smart-accounts',
    src: slideSmartAccountsUrl,
    alt: 'Experience next-gen wallet security with Stellar Smart Accounts.',
  },
  {
    id: 'swap',
    src: slideSwapUrl,
    alt: 'Swap Stellar assets instantly without leaving your wallet.',
  },
  {
    id: 'multisig',
    src: slideMultisigUrl,
    alt: 'Securely manage shared and business wallets with Multisig Account.',
  },
  {
    id: 'session-keys',
    src: slideSessionKeysUrl,
    alt: 'Coming soon: Delegate permissions with secure Session Keys.',
  },
]

type Props = {
  className?: string
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function loadDismissedIds(): Promise<string[]> {
  try {
    const res = await chrome.storage.local.get([DISMISSED_STORAGE_KEY])
    const raw = res[DISMISSED_STORAGE_KEY]
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

async function persistDismissedIds(ids: string[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [DISMISSED_STORAGE_KEY]: ids })
  } catch {
    // ignore storage failures in UI
  }
}

export function NewsCarousel({ className }: Props) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [storageReady, setStorageReady] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const drag = useRef<{
    startX: number
    startIndex: number
    isDragging: boolean
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadDismissedIds().then((ids) => {
      if (cancelled) return
      setDismissedIds(ids)
      setStorageReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const slides = useMemo(() => {
    const dismissed = new Set(dismissedIds)
    return ALL_SLIDES.filter((s) => !dismissed.has(s.id))
  }, [dismissedIds])

  const slidesCount = slides.length

  const clampIndex = useCallback(
    (i: number) => {
      if (slidesCount <= 0) return 0
      return ((i % slidesCount) + slidesCount) % slidesCount
    },
    [slidesCount]
  )

  const goTo = useCallback((i: number) => setActiveIndex(clampIndex(i)), [clampIndex])

  useEffect(() => {
    if (slidesCount === 0) return
    setActiveIndex((i) => clampIndex(i))
  }, [slidesCount, clampIndex])

  useEffect(() => {
    if (slidesCount <= 1 || autoplayPaused || prefersReducedMotion()) return
    const id = window.setInterval(() => {
      setActiveIndex((i) => clampIndex(i + 1))
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [slidesCount, autoplayPaused, clampIndex, activeIndex])

  const onDismiss = useCallback(
    (slideId: NewsSlideId, e: React.MouseEvent | React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setDismissedIds((prev) => {
        if (prev.includes(slideId)) return prev
        const next = [...prev, slideId]
        void persistDismissedIds(next)
        return next
      })
    },
    []
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (slidesCount <= 1) return
      if ((e.target as HTMLElement).closest('[data-news-dismiss]')) return
      setAutoplayPaused(true)
      drag.current = { startX: e.clientX, startIndex: activeIndex, isDragging: true }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [activeIndex, slidesCount]
  )

  const onPointerMove = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current?.isDragging) return
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = drag.current
      drag.current = null
      setAutoplayPaused(false)
      if (!state?.isDragging || slidesCount <= 1) return

      const dx = e.clientX - state.startX
      if (dx > SWIPE_THRESHOLD_PX) goTo(state.startIndex - 1)
      else if (dx < -SWIPE_THRESHOLD_PX) goTo(state.startIndex + 1)
    },
    [goTo, slidesCount]
  )

  // Wait for storage so dismissed slides don't flash back briefly.
  if (!storageReady || slidesCount === 0) return null

  return (
    <div
      className={['flex w-full flex-col items-center gap-2', className].filter(Boolean).join(' ')}
    >
      <div
        className="relative h-[100px] w-full overflow-hidden rounded-[20px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="region"
        aria-label="News"
        aria-roledescription="carousel"
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out will-change-transform"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="relative h-full w-full shrink-0">
              <img
                src={slide.src}
                alt={slide.alt}
                className="block h-full w-full select-none object-cover object-left"
                draggable={false}
              />
              <button
                type="button"
                data-news-dismiss
                aria-label="Dismiss"
                className="absolute right-3 top-3 z-10 size-5"
                onClick={(e) => onDismiss(slide.id, e)}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <img src={dismissIconUrl} alt="" className="size-5" draggable={false} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {slidesCount > 1 ? (
        <div
          className="flex items-center justify-center gap-0.5"
          aria-label="News carousel pagination"
        >
          {slides.map((slide, i) => {
            const isActive = i === activeIndex
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => {
                  goTo(i)
                  setAutoplayPaused(false)
                }}
                className={[
                  'rounded-full transition-colors',
                  isActive ? 'h-[10px] w-[14px] bg-primary' : 'size-[6px] bg-[#383838]',
                ].join(' ')}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={isActive ? 'true' : undefined}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
