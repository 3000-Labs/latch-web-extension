import React, { useState } from 'react'
import { Copy } from 'lucide-react'

export function TransactionDetailFactRow({
  label,
  value,
  copyable,
  isLast,
}: {
  label: string
  value: string
  copyable?: boolean
  isLast?: boolean
}) {
  const [copied, setCopied] = useState(false)

  return (
    <div className={["flex items-center justify-between gap-3 py-4", !isLast ? "border-b border-[#2C2C2E]" : ""].join(' ')}>
      <span className="text-[14px] text-[#8E8E93]">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[14px] font-semibold text-white">{value}</span>
        {copyable ? (
          <button
            type="button"
            className="shrink-0 text-[#8E8E93] hover:text-white transition-colors"
            aria-label={`Copy ${label}`}
            onClick={() => {
              void navigator.clipboard.writeText(value).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              })
            }}
          >
            <Copy className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden />
            {copied ? <span className="sr-only">Copied</span> : null}
          </button>
        ) : null}
      </div>
    </div>
  )
}
