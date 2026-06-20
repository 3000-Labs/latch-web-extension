import React, { useState } from 'react'

import { Eye, EyeOff } from 'lucide-react'

export function SeedPhraseWordField({
  index,
  value,
  onChange,
  onPaste,
  compact,
}: {
  index: number
  value: string
  onChange: (value: string) => void
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void
  compact?: boolean
}) {
  const n = index + 1
  const [revealed, setRevealed] = useState(false)
  return (
    <div
      className={[
        'flex items-center gap-2 rounded-xl border border-border bg-[#242221] px-3',
        compact ? 'py-2' : 'py-2.5',
      ].join(' ')}
    >
      <span className="w-5 shrink-0 text-sm font-bold text-fg">{n}</span>
      <input
        type={revealed ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={`Word ${n}`}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-fg outline-none placeholder:font-medium placeholder:text-muted py-1"
        placeholder={`Word ${n}`}
      />
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? `Hide word ${n}` : `Show word ${n}`}
        title={revealed ? 'Hide' : 'Show'}
        className="grid h-6 w-6 place-items-center rounded-full text-fg/80 hover:bg-surface/60 active:bg-surface/80"
      >
        {revealed ? (
          <EyeOff className="h-[16px] w-[16px]" strokeWidth={2} aria-hidden />
        ) : (
          <Eye className="h-[16px] w-[16px]" strokeWidth={2} aria-hidden />
        )}
      </button>
    </div>
  )
}
