import React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { SwapTokenVm } from '../swapVm'
import { TokenAvatar } from '../../components/TokenAvatar'

export function TokenPickerModal({
  isOpen,
  onClose,
  tokens,
  selectedTokenId,
  onSelect,
}: {
  isOpen: boolean
  onClose: () => void
  tokens: SwapTokenVm[]
  selectedTokenId: string
  onSelect: (tokenId: string) => void
}) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-4">
      <div className="absolute inset-0 cursor-default" onClick={onClose} aria-hidden />

      <div className="relative z-10 w-full max-w-sm space-y-4 rounded-[28px] border border-border/30 bg-[#0E0E0E] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-fg">Select Token</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-fg/60 hover:bg-surface active:bg-surface/80"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="max-h-[280px] space-y-2.5 overflow-y-auto pr-1">
          {tokens.map((token) => {
            const isSelected = token.id === selectedTokenId
            return (
              <button
                key={token.id}
                type="button"
                onClick={() => {
                  onSelect(token.id)
                  onClose()
                }}
                className={[
                  'flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border/30 bg-surface/50 hover:border-border/60 hover:bg-surface',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <TokenAvatar
                    symbol={token.symbol}
                    iconUrl={token.iconUrl}
                    className="h-10 w-10"
                    rounded="rounded-xl"
                  />
                  <div>
                    <div className="text-sm font-extrabold text-fg">{token.name}</div>
                    <div className="mt-0.5 text-xs font-semibold text-muted/70">{token.symbol}</div>
                  </div>
                </div>
                {isSelected ? (
                  <span className="text-xs font-extrabold text-primary">Selected</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
