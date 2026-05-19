import React, { useRef } from 'react'

import { cryptoToFiat, fiatToCrypto } from '../../lib/sendAmount'
import type { SendInputMode } from '../../types/send'

function AmountCursor() {
  return (
    <span className="mx-0.5 inline-block h-10 w-0.5 shrink-0 animate-pulse bg-primary align-middle" aria-hidden />
  )
}

export function SendAmountDisplay({
  amount,
  inputMode,
  symbol,
  onAmountChange,
  onToggleMode,
}: {
  amount: string
  inputMode: SendInputMode
  symbol: string
  onAmountChange: (next: string) => void
  onToggleMode: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const displayAmount = amount || '0'
  const secondaryCrypto =
    inputMode === 'fiat' ? (fiatToCrypto(amount, symbol) ?? '0') : amount || '0'
  const secondaryFiat =
    inputMode === 'crypto' ? (cryptoToFiat(amount || '0', symbol) ?? '0.00') : null

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, '')
    onAmountChange(cleaned)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2">
      <div
        className="flex cursor-text flex-wrap items-baseline justify-center"
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        {inputMode === 'fiat' ? (
          <>
            <span className="text-[48px] font-extrabold leading-none text-fg">$</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleChange(e.target.value)}
              className="min-w-[1ch] max-w-[240px] bg-transparent text-[48px] font-extrabold leading-none text-fg outline-none"
              style={{ width: `${Math.max(1, displayAmount.length)}ch` }}
              aria-label="Amount in dollars"
            />
            <AmountCursor />
          </>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleChange(e.target.value)}
              className={[
                'min-w-[1ch] max-w-[240px] bg-transparent text-[48px] font-extrabold leading-none outline-none',
                displayAmount === '0' && !amount ? 'text-fg/40' : 'text-fg',
              ].join(' ')}
              style={{ width: `${Math.max(1, displayAmount.length)}ch` }}
              aria-label={`Amount in ${symbol}`}
            />
            <AmountCursor />
            <span className="text-[48px] font-extrabold leading-none text-fg">{symbol}</span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onToggleMode}
        className="mt-2 text-sm font-bold text-muted hover:text-fg/80"
      >
        {inputMode === 'fiat'
          ? `${secondaryCrypto} ${symbol}`
          : `$${secondaryFiat ?? '0.00'}`}
      </button>
    </div>
  )
}
