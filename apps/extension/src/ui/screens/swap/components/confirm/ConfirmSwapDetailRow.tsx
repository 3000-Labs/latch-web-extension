import React from 'react'

import chevronRightIconUrl from 'url:../../../../../../assets/home/icon-chevron-right.svg'

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs tracking-[-0.24px] text-[#b3b3b3]">{children}</span>
}

function DetailValue({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium tracking-[-0.12px] text-[#fcfcfc]">{children}</span>
}

export function ConfirmSwapDetailRow({
  label,
  value,
  onClick,
  showChevron,
}: {
  label: string
  value: React.ReactNode
  onClick?: () => void
  showChevron?: boolean
}) {
  const content = (
    <>
      <DetailLabel>{label}</DetailLabel>
      <div className="flex items-center gap-1">
        <DetailValue>{value}</DetailValue>
        {showChevron ? (
          <img src={chevronRightIconUrl} alt="" className="size-4 shrink-0" aria-hidden />
        ) : null}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between transition-opacity hover:opacity-80"
      >
        {content}
      </button>
    )
  }

  return <div className="flex w-full items-center justify-between">{content}</div>
}
