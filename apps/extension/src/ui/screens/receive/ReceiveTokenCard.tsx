import React from 'react'
import { QrCode } from 'lucide-react'
import { CopyAddressButton } from '../../components/CopyAddressButton'

export interface ReceiveToken {
  id: string
  name: string
  balance: string
  symbol: string
  address: string
  iconUrl?: string | null
}

export function ReceiveTokenCard({
  token,
  onSelect,
}: {
  token: ReceiveToken
  onSelect: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className="flex w-full items-center justify-between rounded-2xl border border-border/40 bg-surface/40 px-4 py-4 text-left hover:bg-surface/60 cursor-pointer transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black flex items-center justify-center p-1 border border-border/30">
          {token.iconUrl ? (
            <img src={token.iconUrl} alt={token.name} className="h-full w-full object-contain" />
          ) : (
            <div className="text-xs font-extrabold text-primary select-none">
              {token.symbol.slice(0, 3)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-fg">{token.name}</div>
          <div className="mt-0.5 text-xs font-semibold text-muted tracking-wider">
            BALANCE{' '}
            <span className="text-fg">
              {token.balance} {token.symbol}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onSelect}
          className="text-muted hover:text-fg transition-colors"
          aria-label="View QR"
        >
          <QrCode className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
        <CopyAddressButton
          address={token.address}
          className="text-muted hover:text-fg transition-colors"
        />
      </div>
    </div>
  )
}
