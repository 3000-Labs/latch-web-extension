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
      className={[
        'h-6 w-11 rounded-full border px-0.5 transition-all duration-200 outline-none flex items-center',
        checked
          ? 'bg-primary border-primary justify-end'
          : 'bg-[#2B2A29] border-[#2B2A29]/60 justify-start',
      ].join(' ')}
      aria-label="Toggle"
    >
      <span
        className={[
          'block h-5 w-5 rounded-full transition-all duration-200 shadow-md',
          checked ? 'bg-[#1F1F1F]' : 'bg-[#8F8E8E]',
        ].join(' ')}
      />
    </button>
  )
}
