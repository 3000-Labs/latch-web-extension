import React from 'react'
import { ChevronDown } from 'lucide-react'

export function AccountPill({ name, onClick }: { name: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-3 rounded-full bg-surface/60 px-4 py-2 shadow-soft',
        'hover:bg-surface/70 active:bg-surface/80',
      ].join(' ')}
    >
      <span className="h-9 w-9 overflow-hidden rounded-full bg-surface/80">
        <img
          alt=""
          className="h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=128&h=128&q=80"
        />
      </span>
      <span className="text-base font-extrabold text-fg">{name}</span>
      <ChevronDown className="h-[18px] w-[18px] text-fg/70" strokeWidth={2} aria-hidden />
    </button>
  )
}
