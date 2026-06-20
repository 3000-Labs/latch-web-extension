import type { ClipboardEvent } from 'react'

const WORD_COUNT = 12

export function RecoveryPhraseGrid({
  words,
  onWordChange,
  onPasteWords,
  cellClassName = 'bg-[#201f1e]',
}: {
  words: string[]
  onWordChange: (index: number, value: string) => void
  onPasteWords: (text: string, startIndex: number) => void
  cellClassName?: string
}) {
  const rows = Array.from({ length: 4 }, (_, row) => row * 3)

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, startIndex: number) => {
    const text = e.clipboardData.getData('text/plain')
    if (!text || !/\s/.test(text.trim())) return
    const parts = text.trim().split(/\s+/).filter(Boolean)
    if (parts.length < 2) return
    e.preventDefault()
    const start = parts.length >= WORD_COUNT ? 0 : startIndex
    onPasteWords(text, start)
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {rows.map((start) => (
        <div key={start} className="flex w-full gap-3">
          {[0, 1, 2].map((offset) => {
            const index = start + offset
            const word = words[index] ?? ''
            return (
              <div
                key={index}
                className={['flex h-[52px] min-w-0 flex-1 items-center rounded-[14px] p-3', cellClassName].join(
                  ' '
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-[9px]">
                  <span className="shrink-0 text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => onWordChange(index, e.target.value)}
                    onPaste={(e) => handlePaste(e, index)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    aria-label={`Word ${index + 1}`}
                    className="min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3] outline-none placeholder:text-[#b3b3b3]"
                  />
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
