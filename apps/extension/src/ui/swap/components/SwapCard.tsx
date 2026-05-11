import React from 'react'

// import { SectionCard } from '../../components/SectionCard'
import type { SwapTokenVm } from '../swapVm'
import { TokenPill } from './TokenPill'

export function SwapCard({
  token,
  rightTop,
  rightBottom,
  headerRight,
  footer,
}: {
  token: SwapTokenVm
  rightTop: React.ReactNode
  rightBottom?: React.ReactNode
  headerRight?: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-surface">
      <div className="px-4 py-4">
        <div className="border-0 bg-transparent p-0 shadow-none">
          <div className="flex items-center justify-between">{headerRight}</div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <TokenPill token={token} />
            <div className="text-right">
              <div className="text-base font-semibold tracking-tight">{rightTop}</div>
              {rightBottom ? (
                <div className="mt-0.5 text-xs font-bold text-muted">{rightBottom}</div>
              ) : null}
            </div>
          </div>

          {footer ? <div className="mt-4 border-t border-border/60 pt-3">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}
