import React from 'react'

export function PulsingDot({ pulsing, className }: { pulsing?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={[
        'relative inline-flex h-2 w-2 rounded-full bg-primary',
        pulsing ? 'animate-pulseDot' : '',
        className ?? '',
      ].join(' ')}
    />
  )
}
