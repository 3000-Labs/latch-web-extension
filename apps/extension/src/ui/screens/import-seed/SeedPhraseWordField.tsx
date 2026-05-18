import React from 'react'

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
  return (
    <div
      className={[
        'flex items-center gap-2 rounded-xl border border-border bg-surface px-3',
        compact ? 'py-2' : 'py-2.5',
      ].join(' ')}
    >
      <span className="w-5 shrink-0 text-sm font-bold text-fg">{n}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={`Word ${n}`}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-fg outline-none placeholder:font-medium placeholder:text-muted"
        placeholder={`Word ${n}`}
      />
    </div>
  )
}
