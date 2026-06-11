import React from 'react'

import chevronRightUrl from 'url:../../../../assets/home/icon-chevron-right.svg'

interface SettingItemProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  rightElement?: React.ReactNode
}

export function SettingItem({ icon, label, onClick, rightElement }: SettingItemProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2 rounded-[14px] bg-card p-3 text-left',
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#1e1e1e] p-1">
        {icon}
      </div>
      <div className="min-w-0 flex-1 text-sm tracking-[-0.28px] text-fg">{label}</div>
      {rightElement ?? (
        <img src={chevronRightUrl} alt="" className="h-6 w-6 shrink-0" aria-hidden />
      )}
    </Component>
  )
}
