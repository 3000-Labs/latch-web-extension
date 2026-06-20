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
    <div className={['flex w-full flex-col items-center gap-2', className].filter(Boolean).join(' ')}>
      <div
        className="w-full overflow-hidden rounded-[18px]"
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
                className="block w-full select-none rounded-[18px]"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-0.5"
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
                'rounded-full transition-colors',
                isActive ? 'h-[10px] w-[14px] bg-primary' : 'h-1.5 w-1.5 bg-white/25',
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
