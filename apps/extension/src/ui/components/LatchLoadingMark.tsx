import { useId, type CSSProperties } from 'react'

import glowUrl from 'url:../../../assets/loading/glow.svg'
import logoSymbolUrl from 'url:../../../assets/loading/logo-symbol.svg'

const RING_RADIUS = 54
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function LatchLoadingMark() {
  const gradientId = useId().replace(/:/g, '')

  return (
    <div className="relative size-[116px] shrink-0">
      <div className="absolute left-[10px] top-[10px] size-[96px]">
        <div className="absolute inset-[-10.42%]">
          <img src={glowUrl} alt="" className="block size-full max-w-none" aria-hidden />
        </div>
      </div>
      <div className="absolute left-0 top-0 size-[116px] overflow-clip">
        <div className="absolute inset-[3.45%]">
          <svg viewBox="0 0 111 111" className="block size-full" fill="none" aria-hidden>
            <defs>
              <linearGradient
                id={gradientId}
                x1="1.75"
                y1="1.75"
                x2="109.75"
                y2="109.75"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFC23F" />
                <stop offset="1" stopColor="#FFAD00" />
              </linearGradient>
            </defs>
            <circle
              cx="55.5"
              cy="55.5"
              r={RING_RADIUS}
              stroke="white"
              strokeOpacity="0.08"
              strokeWidth="3"
            />
            <g transform="rotate(-90 55.5 55.5)">
              <circle
                cx="55.5"
                cy="55.5"
                r={RING_RADIUS}
                stroke={`url(#${gradientId})`}
                strokeWidth="3.5"
                strokeLinecap="round"
                className="latch-loading-ring"
                style={
                  {
                    '--latch-loading-ring-c': RING_CIRCUMFERENCE,
                  } as CSSProperties
                }
              />
            </g>
          </svg>
        </div>
        <div className="absolute inset-[19.83%_20.69%_20.69%_21.55%]">
          <div className="absolute bottom-[31.03%] left-[calc(50%-0.32px)] top-[25.49%] w-[56px] -translate-x-1/2">
            <img
              src={logoSymbolUrl}
              alt=""
              className="absolute inset-0 block size-full max-w-none"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  )
}
