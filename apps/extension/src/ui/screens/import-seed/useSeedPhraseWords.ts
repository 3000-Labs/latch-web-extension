import { useCallback, useMemo, useState } from 'react'
import { validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'

const WORD_COUNT = 12

function splitPastedMnemonic(text: string): string[] {
  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, WORD_COUNT)
}

export function useSeedPhraseWords() {
  const [words, setWords] = useState<string[]>(() => Array.from({ length: WORD_COUNT }, () => ''))

  const setWordAt = useCallback((index: number, value: string) => {
    setWords((prev) => {
      const next = [...prev]
      next[index] = value.trim().toLowerCase()
      return next
    })
  }, [])

  const fillFromPaste = useCallback((pastedText: string, startIndex = 0): boolean => {
    const parts = splitPastedMnemonic(pastedText)
    if (parts.length === 0) return false

    setWords((prev) => {
      const next = [...prev]
      for (let i = 0; i < parts.length && startIndex + i < WORD_COUNT; i++) {
        next[startIndex + i] = parts[i]!
      }
      return next
    })
    return parts.length > 0
  }, [])

  const mnemonic = useMemo(() => words.map((w) => w.trim()).filter(Boolean).join(' '), [words])

  const allFilled = useMemo(() => words.every((w) => w.trim().length > 0), [words])

  const isValid = useMemo(() => {
    if (!allFilled) return false
    return validateMnemonic(mnemonic, wordlist)
  }, [allFilled, mnemonic])

  const reset = useCallback(() => {
    setWords(Array.from({ length: WORD_COUNT }, () => ''))
  }, [])

  return { words, setWordAt, fillFromPaste, mnemonic, allFilled, isValid, reset, wordCount: WORD_COUNT }
}
