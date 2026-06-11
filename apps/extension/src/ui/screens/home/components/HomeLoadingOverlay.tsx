import React from 'react'

import loadingLogoUrl from 'url:../../../../../assets/home/loading-logo.svg'

export function HomeLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgb(var(--latch-overlay))] opacity-90"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-2">
        <div className="relative h-[69px] w-[67px] shrink-0">
          <div className="absolute inset-x-0 bottom-[18.46%] top-[12.93%] flex items-center justify-center">
            <img
              src={loadingLogoUrl}
              alt=""
              className="h-[47px] w-[63px] rotate-[20deg] shrink-0"
              aria-hidden
            />
          </div>
        </div>
        <p className="text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fbfbfb]">
          Loading...
        </p>
      </div>
    </div>
  )
}
