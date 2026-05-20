import React, { useCallback } from 'react'

import { SeedPhraseWordField } from './SeedPhraseWordField'

export function SeedPhraseWordGrid({
  words,
  onWordChange,
  onPasteWords,
  compact,
}: {
  words: string[]
  onWordChange: (index: number, value: string) => void
  onPasteWords: (text: string, startIndex: number) => void
  compact?: boolean
}) {
  const handlePaste = useCallback(
    (e: React.ClipboardEvent, startIndex: number) => {
      const text = e.clipboardData.getData('text/plain')
      if (!text || !/\s/.test(text.trim())) return
      const parts = text.trim().split(/\s+/).filter(Boolean)
      if (parts.length < 2) return
      e.preventDefault()
      const start = parts.length >= words.length ? 0 : startIndex
      onPasteWords(text, start)
    },
    [onPasteWords]
  )

  return (
    <div className={['grid grid-cols-2', compact ? 'gap-2' : 'gap-2.5'].join(' ')}>
      {words.map((word, i) => (
        <SeedPhraseWordField
          key={i}
          index={i}
          value={word}
          onChange={(v) => onWordChange(i, v)}
          onPaste={(e) => handlePaste(e, i)}
          compact={compact}
        />
      ))}
    </div>
  )
}
