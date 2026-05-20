import React from 'react'

export function KeyValueRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="text-[#8E8E93] font-semibold">{label}</div>
      <div className="font-extrabold text-white">{value}</div>
    </div>
  )
}
