import React from 'react'

interface SettingsSectionProps {
  label: string
  children: React.ReactNode
}

export function SettingsSection({ label, children }: SettingsSectionProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-sm font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
        {label}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}
