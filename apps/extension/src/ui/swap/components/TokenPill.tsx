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

  const subtitle =
    token.name === 'Tether' || token.symbol.toUpperCase() === 'USDT' ? 'Tether USDT' : token.name

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
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="shrink-0 text-[17px] font-extrabold leading-none tracking-tight text-white">
            {token.name}
          </span>
          <ChevronDown
            className="h-4.5 w-4.5 shrink-0 text-[#8E8E93] leading-none transition-transform group-hover:translate-y-0.5"
            strokeWidth={2.5}
          />
        </div>
        <span className="mt-1.5 whitespace-nowrap text-[13px] font-semibold leading-none text-[#8E8E93]">
          {subtitle}
        </span>
      </div>
    </button>
  )
}
