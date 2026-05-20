import React from 'react'

interface SettingsSectionProps {
  label: string
  children: React.ReactNode
}

export function SettingsSection({ label, children }: SettingsSectionProps) {
  return (
    <div className="space-y-2">
      <div className="px-1 text-xs font-bold text-muted/60 uppercase tracking-wider">{label}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
