import React from "react"

export function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "h-7 w-12 rounded-full border border-border px-1 transition-colors",
        checked ? "bg-primary/80" : "bg-surface/60"
      ].join(" ")}
    >
      <span
        className={[
          "block h-5 w-5 rounded-full bg-bg shadow-soft transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        ].join(" ")}
      />
    </button>
  )
}

