import React from 'react'

import chevronRightUrl from 'url:../../../../assets/home/icon-chevron-right.svg'

interface SettingItemProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  rightElement?: React.ReactNode
  danger?: boolean
  showChevron?: boolean
}

export function SettingItem({
  icon,
  label,
  onClick,
  rightElement,
  danger,
  showChevron = true,
}: SettingItemProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2 rounded-[14px] bg-[#201f1e] p-3 text-left',
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
    >
      <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#1e1e1e] p-1">
        {icon}
      </div>
      <div
        className={[
          'min-w-0 flex-1 text-sm tracking-[-0.28px]',
          danger ? 'text-[#ea471e]' : 'text-[#fcfcfc]',
        ].join(' ')}
      >
        {label}
      </div>
      {rightElement ??
        (showChevron ? (
          <img src={chevronRightUrl} alt="" className="size-6 shrink-0" aria-hidden />
        ) : null)}
    </Component>
  )
}
