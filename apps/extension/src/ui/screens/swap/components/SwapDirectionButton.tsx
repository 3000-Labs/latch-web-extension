import React from 'react'

import swapIconUrl from 'url:../../../../../assets/icons/swap-icon-black.svg'

export function SwapDirectionButton({
  onClick,
  className = '',
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Swap direction"
      className={[
        'pointer-events-auto grid size-16 place-items-center rounded-[36px] bg-primary',
        className,
      ].join(' ')}
    >
      <img src={swapIconUrl} alt="" className="size-6" aria-hidden />
    </button>
  )
}
