import React from "react"

export function Avatar({
  name,
  size = 44
}: {
  name: string
  size?: number
}) {
  const initial = (name.trim()[0] ?? "?").toUpperCase()
  const textClass = size <= 36 ? "text-xs" : "text-sm"
  return (
    <div
      className={["grid place-items-center rounded-full bg-surface/60 font-extrabold text-fg/90 shadow-soft", textClass].join(" ")}
      style={{ width: size, height: size }}
      aria-label={name}
      title={name}
    >
      {initial}
    </div>
  )
}

