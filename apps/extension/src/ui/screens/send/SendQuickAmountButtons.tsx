import React from 'react'

const PRESETS = [50, 500, 1000] as const

export function SendQuickAmountButtons({ onSelect }: { onSelect: (usd: number) => void }) {
  return (
    <div className="flex shrink-0 gap-3">
      {PRESETS.map((usd) => (
        <button
          key={usd}
          type="button"
          onClick={() => onSelect(usd)}
          className="flex-1 rounded-[16px] bg-[#161616] py-3.5 text-[15px] font-semibold text-[#EBEBEB] hover:bg-[#2C2C2E] transition-colors"
        >
          ${usd}
        </button>
      ))}
    </div>
  )
}
