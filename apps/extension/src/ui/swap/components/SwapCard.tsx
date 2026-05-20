import React from 'react'
import { ChevronDown } from 'lucide-react'
import type { SwapTokenVm } from '../swapVm'
import { TokenPill } from './TokenPill'

interface SwapCardProps {
  token: SwapTokenVm
  type: 'pay' | 'receive'
  rightTop: React.ReactNode
  rightBottom?: React.ReactNode
  onTokenSelect?: () => void
  balance?: number
  onMaxClick?: () => void
  onAddFundsClick?: () => void
}

export function SwapCard({
  token,
  type,
  rightTop,
  rightBottom,
  onTokenSelect,
  balance = 0,
  onMaxClick,
  onAddFundsClick,
}: SwapCardProps) {
  const isPay = type === 'pay'
  const walletLabel = 'My Wallet...670d'

  return (
    <div className="rounded-[24px] border border-border/20 bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <TokenPill token={token} onClick={onTokenSelect} />

        <div className="text-right flex flex-col items-end min-w-0">
          <div className="text-2xl font-bold text-white tracking-tight">{rightTop}</div>
          {rightBottom ? (
            <div className="mt-1 text-sm font-semibold text-muted tracking-tight">
              {rightBottom}
            </div>
          ) : null}
        </div>
      </div>

      <div className="my-4 border-t border-border/60" />

      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        {isPay ? (
          <button
            type="button"
            className="flex items-center gap-1 hover:text-fg transition-colors cursor-pointer text-left focus:outline-none"
          >
            <span>{walletLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />
          </button>
        ) : (
          <span>{walletLabel}</span>
        )}

        <div className="flex items-center gap-1.5">
          <svg
            className="h-3.5 w-3.5 text-muted shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 12h.01M21 12h-4" />
          </svg>

          <span>{balance}</span>

          {isPay && (
            <>
              {balance > 0 ? (
                <button
                  type="button"
                  onClick={onMaxClick}
                  className="text-primary hover:brightness-110 font-bold ml-1 cursor-pointer focus:outline-none"
                >
                  Max
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onAddFundsClick}
                  className="text-primary hover:brightness-110 font-bold ml-1 cursor-pointer focus:outline-none"
                >
                  Add funds
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
