import React from "react"

export function KeyValueRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="text-muted">{label}</div>
      <div className="font-extrabold text-fg/90">{value}</div>
    </div>
  )
}

