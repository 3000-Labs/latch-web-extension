import React from "react"

export function FilterChip({
  active,
  children,
  onClick
}: {
  active: boolean
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-extrabold",
        active ? "border-primary text-primary" : "border-border text-fg/80 hover:bg-surface/50"
      ].join(" ")}
    >
      {children}
    </button>
  )
}

