import React from 'react'

const PRESETS = [50, 500, 1000] as const

export function SendQuickAmountButtons({ onSelect }: { onSelect: (usd: number) => void }) {
  return (
    <div className="flex w-full shrink-0 gap-3">
      {PRESETS.map((usd) => (
        <button
          key={usd}
          type="button"
          onClick={() => onSelect(usd)}
          className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-[#2a2928] p-3 text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#b3b3b3]"
        >
          ${usd}
        </button>
      ))}
    </div>
  )
}
