import React from 'react'
import { ChevronRight } from 'lucide-react'

interface ConfirmRowProps {
  label: string
  value: React.ReactNode
  onClick?: () => void
  showChevron?: boolean
}

export function ConfirmRow({ label, value, onClick, showChevron = false }: ConfirmRowProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between gap-3 text-sm py-0.5 text-left',
        onClick ? 'hover:text-fg active:scale-[0.99] transition-all cursor-pointer' : '',
      ].join(' ')}
    >
      <span className="text-muted/70 font-semibold">{label}</span>
      <div className="flex items-center gap-1.5 text-right font-extrabold text-fg">
        <span>{value}</span>
        {showChevron && <ChevronRight className="h-4 w-4 text-muted/50" strokeWidth={2.5} />}
      </div>
    </Component>
  )
}
