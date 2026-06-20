import React from 'react'

export function ConfirmSwapSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex w-full flex-col gap-[13px]">
      <p className="text-xs tracking-[-0.24px] text-[#b3b3b3]">{label}</p>
      {children}
    </div>
  )
}
