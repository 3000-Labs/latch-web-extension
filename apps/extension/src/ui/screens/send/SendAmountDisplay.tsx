import React, { useRef, useState } from 'react'

import { cryptoToFiat, fiatToCrypto } from '../../lib/sendAmount'
import type { SendInputMode } from '../../types/send'

function AmountCaret({ visible }: { visible: boolean }) {
  if (!visible) return null
  return <span aria-hidden className="h-[57px] w-0.5 shrink-0 rounded-[2px] bg-primary" />
}

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
  const [focused, setFocused] = useState(false)
  const isEmpty = amount.length === 0

  const secondaryLabel =
    inputMode === 'fiat'
      ? `${fiatToCrypto(amount, priceUsd) ?? '0'} ${symbol}`
      : `$${cryptoToFiat(amount || '0', priceUsd) ?? '0.00'}`

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, '')
    onAmountChange(cleaned)
  }

  const focusInput = () => {
    inputRef.current?.focus()
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div
        className="flex h-[86px] cursor-text items-center justify-center gap-0.5"
        onClick={focusInput}
        role="presentation"
      >
        {inputMode === 'fiat' ? (
          <>
            <span className="text-[48px] font-semibold leading-[1.28] tracking-[-1.44px] text-[#fcfcfc]">
              $
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="0"
              className={[
                'min-w-[1ch] max-w-[220px] bg-transparent text-[48px] font-semibold leading-[1.28] tracking-[-1.44px] outline-none caret-transparent placeholder:text-[#8a8a8a]',
                isEmpty ? 'text-[#8a8a8a]' : 'text-[#fcfcfc]',
              ].join(' ')}
              style={{ width: `${Math.max(1, (amount || '0').length)}ch` }}
              aria-label="Amount in dollars"
            />
            <AmountCaret visible={focused} />
          </>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="0"
              className={[
                'min-w-[1ch] max-w-[220px] bg-transparent text-[56px] font-bold leading-[1.2] tracking-[-1.68px] outline-none caret-transparent placeholder:text-[#8a8a8a]',
                isEmpty ? 'text-[#8a8a8a]' : 'text-[#fcfcfc]',
              ].join(' ')}
              style={{ width: `${Math.max(1, (amount || '0').length)}ch` }}
              aria-label={`Amount in ${symbol}`}
            />
            <AmountCaret visible={focused} />
            <span className="text-[48px] font-semibold leading-[1.28] tracking-[-1.44px] text-[#fcfcfc]">
              {symbol}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleMode}
        className="text-sm font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]"
      >
        {secondaryLabel}
      </button>
    </div>
  )
}
