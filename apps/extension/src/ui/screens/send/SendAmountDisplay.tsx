import React, { useRef } from 'react'

import { cryptoToFiat, fiatToCrypto } from '../../lib/sendAmount'
import type { SendInputMode } from '../../types/send'

export function SendAmountDisplay({
  amount,
  inputMode,
  symbol,
  priceUsd,
  onAmountChange,
  onToggleMode,
}: {
  amount: string
  inputMode: SendInputMode
  symbol: string
  priceUsd: number | null
  onAmountChange: (next: string) => void
  onToggleMode: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const displayAmount = amount || '0'
  const secondaryCrypto =
    inputMode === 'fiat' ? (fiatToCrypto(amount, priceUsd) ?? '0') : amount || '0'
  const secondaryFiat =
    inputMode === 'crypto' ? (cryptoToFiat(amount || '0', priceUsd) ?? '0.00') : null

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
            <span className="text-[56px] font-bold leading-none text-white mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="0.00"
              className="min-w-[1ch] max-w-[240px] bg-transparent text-[56px] font-bold leading-none text-white outline-none caret-[#FFAD00] placeholder:text-[#8E8E93]"
              style={{ width: `${Math.max(1, displayAmount.length)}ch` }}
              aria-label="Amount in dollars"
            />
          </>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="0"
              className={[
                'min-w-[1ch] max-w-[240px] bg-transparent text-[56px] font-bold leading-none outline-none caret-[#FFAD00] placeholder:text-[#8E8E93]',
                !amount ? 'text-[#8E8E93]' : 'text-white',
              ].join(' ')}
              style={{ width: `${Math.max(1, displayAmount.length)}ch` }}
              aria-label={`Amount in ${symbol}`}
            />
            <span className="text-[56px] font-bold leading-none text-white ml-3">{symbol}</span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onToggleMode}
        className="mt-6 text-[15px] text-[#8E8E93] hover:text-white transition-colors"
      >
        {inputMode === 'fiat' ? `${secondaryCrypto} ${symbol}` : `$${secondaryFiat ?? '0.00'}`}
      </button>
    </div>
  )
}
