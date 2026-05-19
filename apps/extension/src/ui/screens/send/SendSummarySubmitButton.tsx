import React from 'react'

export function SendSummarySubmitButton({
  progressLabel,
  onSend,
}: {
  progressLabel: string | null
  onSend: () => void
}) {
  const loading = progressLabel != null
  const label = loading ? progressLabel : 'Send'

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onSend}
      className="h-12 w-full shrink-0 rounded-full bg-primary text-base font-extrabold text-black shadow-soft disabled:opacity-50"
    >
      {label}
    </button>
  )
}
