import React from 'react'

interface SettingsToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
}

export function SettingsToggle({ checked, onChange }: SettingsToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-7 w-16 shrink-0 overflow-hidden rounded-full bg-stroke outline-none"
      aria-label="Toggle"
    >
      <span
        className={[
          'absolute top-[2px] h-[24px] w-[39px] rounded-full bg-white transition-all duration-200',
          checked ? 'left-[23px]' : 'left-[2px]',
        ].join(' ')}
      />
    </button>
  )
}
