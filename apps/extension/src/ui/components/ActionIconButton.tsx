import React from "react"

export function ActionIconButton({
  label,
  icon,
  onClick
}: {
  label: string
  icon: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-surface/60 shadow-soft">
        <span className="text-primary">{icon}</span>
      </span>
      <span className="text-xs font-bold text-muted">{label}</span>
    </button>
  )
}

