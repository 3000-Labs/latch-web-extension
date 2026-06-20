import React from 'react'

import stellarIconUrl from 'url:../../../../../assets/icons/stellar.svg'
import usdtIconUrl from 'url:../../../../../assets/icons/usdt.png'
import type { SwapTokenVm } from '../../../swap/swapVm'

function tokenAvatarBg(token: SwapTokenVm): string {
  const sym = token.symbol.toUpperCase()
  if (sym === 'XLM' || token.name.toLowerCase() === 'stellar') return 'bg-[#302813]'
  if (sym === 'USDT' || token.name.toLowerCase() === 'tether') return 'bg-[#13302b]'
  return 'bg-border'
}

function tokenIconUrl(token: SwapTokenVm): string | null {
  const sym = token.symbol.toUpperCase()
  if (sym === 'XLM' || token.name.toLowerCase() === 'stellar') return stellarIconUrl
  if (sym === 'USDT') return usdtIconUrl
  return token.iconUrl ?? null
}

export function SwapTokenAvatar({ token }: { token: SwapTokenVm }) {
  const iconUrl = tokenIconUrl(token)

  return (
    <div
      className={[
        'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg p-1',
        tokenAvatarBg(token),
      ].join(' ')}
    >
      {iconUrl ? (
        <img src={iconUrl} alt="" className="size-6 object-contain" aria-hidden />
      ) : (
        <span className="text-sm font-semibold text-fg">{token.symbol[0]}</span>
      )}
    </div>
  )
}
