import React from 'react'
import { ChevronDown } from 'lucide-react'

import { TokenAvatar } from '../../components/TokenAvatar'
import type { SwapTokenVm } from '../swapVm'

export function TokenPill({ token, onClick }: { token: SwapTokenVm; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-xl">
      <TokenAvatar symbol={token.symbol} iconUrl={token.iconUrl} className="h-8 w-8" />
      <span className="leading-tight">
        <div className="flex items-center gap-1 text-sm font-extrabold">
          <span>{token.name}</span>
          <ChevronDown className="ml-1 h-[18px] w-[18px] text-fg/60" strokeWidth={2} aria-hidden />
        </div>
        <div className="text-xs font-bold text-muted">
          {token.name} {token.symbol}
        </div>
      </span>
    </button>
  )
}
