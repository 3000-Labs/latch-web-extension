import React from 'react'
import { ChevronRight } from 'lucide-react'

interface SettingItemProps {
  icon: React.ReactNode
  label: string
  value?: string
  onClick?: () => void
  rightElement?: React.ReactNode
  showChevron?: boolean
}

export function SettingItem({
  icon,
  label,
  value,
  onClick,
  rightElement,
  showChevron = true,
}: SettingItemProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between rounded-[20px] border border-border/20 bg-surface px-4 py-[14px] text-left transition-all',
        onClick ? 'hover:bg-surface/75 active:bg-surface/85 cursor-pointer' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface/80 border border-border/30 text-fg/80">
          {icon}
        </div>
        <span className="truncate text-sm font-extrabold text-fg">{label}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {value && (
          <span className="text-xs font-semibold text-muted/70 tracking-wider">{value}</span>
        )}
        {rightElement}
        {showChevron && !rightElement && (
          <ChevronRight className="h-[18px] w-[18px] text-fg/40" strokeWidth={2.5} />
        )}
      </div>
    </Component>
  )
}
