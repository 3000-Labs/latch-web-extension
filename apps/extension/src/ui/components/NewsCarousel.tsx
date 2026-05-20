import React, { useCallback, useMemo, useRef, useState } from 'react'

import newsSlideUrl from 'url:../../../assets/news/news-slide.png'

type Props = {
  className?: string
  slidesCount?: number
}

export function NewsCarousel({ className, slidesCount = 3 }: Props) {
  const slides = useMemo(() => Array.from({ length: slidesCount }, (_, i) => i), [slidesCount])
  const [activeIndex, setActiveIndex] = useState(0)

  const clampIndex = useCallback(
    (i: number) => {
      if (slidesCount <= 0) return 0
      return ((i % slidesCount) + slidesCount) % slidesCount
    },
    [slidesCount]
  )

  const goTo = useCallback((i: number) => setActiveIndex(clampIndex(i)), [clampIndex])

  const drag = useRef<{
    startX: number
    startIndex: number
    isDragging: boolean
  } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (slidesCount <= 1) return
      drag.current = { startX: e.clientX, startIndex: activeIndex, isDragging: true }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [activeIndex, slidesCount]
  )

  const onPointerMove = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current?.isDragging) return
    // We keep movement purely for intent; actual slide change occurs on release.
    // This avoids partial transforms that would deviate from the design.
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = drag.current
      drag.current = null
      if (!state?.isDragging || slidesCount <= 1) return

      const dx = e.clientX - state.startX
      const threshold = 40
      if (dx > threshold) goTo(state.startIndex - 1)
      else if (dx < -threshold) goTo(state.startIndex + 1)
    },
    [goTo, slidesCount]
  )

  return (
    <div className={className}>
      <div
        className="overflow-hidden rounded-[16px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="region"
        aria-label="News"
      >
        <div
          className="flex transition-transform duration-300 ease-out will-change-transform"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((i) => (
            <div key={i} className="w-full shrink-0">
              <img
                src={newsSlideUrl}
                alt=""
                className="block w-full select-none"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-3 flex items-center justify-center gap-[10px]"
        aria-label="News carousel pagination"
      >
        {slides.map((i) => {
          const isActive = i === activeIndex
          return (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={[
                'h-2 transition-colors',
                isActive ? 'w-6 rounded-full bg-primary' : 'w-2 rounded-full bg-white/25',
              ].join(' ')}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={isActive ? 'true' : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
