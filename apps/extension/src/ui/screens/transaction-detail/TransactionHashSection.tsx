import React from 'react'

export function TransactionHashSection({ hash }: { hash: string }) {
  return (
    <div className="mt-8">
      <div className="text-sm font-extrabold text-fg">Transaction Hash</div>
      <div className="mt-2 break-all rounded-2xl border border-border bg-surface/60 px-4 py-3 text-xs font-medium leading-relaxed text-muted">
        {hash}
      </div>
    </div>
  )
}
