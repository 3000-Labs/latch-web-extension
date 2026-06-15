import React from 'react'

export function AccountRadio({ selected }: { selected: boolean }) {
  return (
    <div
      className={[
        'relative size-4 shrink-0 rounded-full',
        selected ? 'border-2 border-primary' : 'border border-[#383838]',
      ].join(' ')}
      aria-hidden
    >
      {selected ? (
        <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      ) : null}
    </div>
  )
}
