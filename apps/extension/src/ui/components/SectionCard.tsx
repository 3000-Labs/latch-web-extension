import React from "react"

export function SectionCard({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={["rounded-2xl border border-border bg-surface/60 p-4 shadow-soft", className ?? ""].join(" ")}>
      {children}
    </div>
  )
}

