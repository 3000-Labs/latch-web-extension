import React from "react"

export function Avatar({
  name,
  size = 44
}: {
  name: string
  size?: number
}) {
  const initial = (name.trim()[0] ?? "?").toUpperCase()
  return (
    <div
      className="grid place-items-center rounded-2xl bg-surface/60 text-sm font-extrabold text-fg/90 shadow-soft"
      style={{ width: size, height: size }}
      aria-label={name}
      title={name}
    >
      {initial}
    </div>
  )
}

