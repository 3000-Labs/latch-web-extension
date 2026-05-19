import React from 'react'

const PRESETS = [50, 500, 1000] as const

export function SendQuickAmountButtons({ onSelect }: { onSelect: (usd: number) => void }) {
  return (
    <div className="flex shrink-0 gap-2">
      {PRESETS.map((usd) => (
        <button
          key={usd}
          type="button"
          onClick={() => onSelect(usd)}
          className="flex-1 rounded-xl border border-border bg-surface/40 py-2.5 text-sm font-extrabold text-fg hover:bg-surface/60"
        >
          ${usd}
        </button>
      ))}
    </div>
  )
}
