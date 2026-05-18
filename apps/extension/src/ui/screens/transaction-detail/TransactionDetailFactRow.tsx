import React, { useState } from 'react'
import { Copy } from 'lucide-react'

export function TransactionDetailFactRow({
  label,
  value,
  copyable,
}: {
  label: string
  value: string
  copyable?: boolean
}) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
      <span className="text-sm font-bold text-muted">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-extrabold text-fg">{value}</span>
        {copyable ? (
          <button
            type="button"
            className="shrink-0 text-fg/70 hover:text-fg"
            aria-label={`Copy ${label}`}
            onClick={() => {
              void navigator.clipboard.writeText(value).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              })
            }}
          >
            <Copy className="h-4 w-4" strokeWidth={2} aria-hidden />
            {copied ? <span className="sr-only">Copied</span> : null}
          </button>
        ) : null}
      </div>
    </div>
  )
}
