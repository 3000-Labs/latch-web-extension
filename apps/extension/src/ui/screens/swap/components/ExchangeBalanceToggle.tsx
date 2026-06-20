import React from 'react'

export function ExchangeBalanceToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'relative h-5 w-8 shrink-0 rounded-[20px] p-0.5 transition-colors',
        checked ? 'bg-primary' : 'bg-border',
      ].join(' ')}
    >
      <span
        className={[
          'block h-4 w-4 rounded-full bg-[#cdcdcd] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-transform',
          checked ? 'translate-x-3' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}
