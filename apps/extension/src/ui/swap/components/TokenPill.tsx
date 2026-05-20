import React from 'react'
import { ChevronDown } from 'lucide-react'
import stellarIconUrl from 'url:../../../../assets/icons/stellar.svg'
import usdtIconUrl from 'url:../../../../assets/icons/usdt.png'
import type { SwapTokenVm } from '../swapVm'

export function TokenPill({ token, onClick }: { token: SwapTokenVm; onClick?: () => void }) {
  const isXlm = token.symbol.toUpperCase() === 'XLM' || token.name.toLowerCase() === 'stellar'

  // Custom backgrounds for Stellar (yellow/brown) and Tether (teal)
  const avatarBg = isXlm ? 'bg-[#251E0A]' : 'bg-[#0C1E19]'

  // Custom icon colors/fallback
  const resolvedIcon = isXlm
    ? stellarIconUrl
    : token.symbol.toUpperCase() === 'USDT'
      ? usdtIconUrl
      : token.iconUrl

  const subtitle = token.name === 'Stellar' ? 'Stellar USDT' : 'Tether USDT'

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
    >
      <div
        className={[
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] p-2.5 transition-all group-hover:brightness-110',
          avatarBg,
        ].join(' ')}
      >
        {resolvedIcon ? (
          <img src={resolvedIcon} className="h-full w-full object-contain" alt="" />
        ) : (
          <span className="text-sm font-extrabold text-white">{token.symbol[0]}</span>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-[17px] font-extrabold text-white leading-none tracking-tight">
            {token.name}
          </span>
          <ChevronDown
            className="h-4.5 w-4.5 text-[#8E8E93] leading-none transition-transform group-hover:translate-y-0.5"
            strokeWidth={2.5}
          />
        </div>
        <span className="text-[13px] font-semibold text-[#8E8E93] mt-1.5 leading-none">
          {subtitle}
        </span>
      </div>
    </button>
  )
}
