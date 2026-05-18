import React, { useState } from 'react'

import { ImportSeedBackButton } from './ImportSeedBackButton'
import { ImportSeedEncryptionForm } from './ImportSeedEncryptionForm'
import { ImportSeedHeading } from './ImportSeedHeading'
import { ImportSeedLogo } from './ImportSeedLogo'
import { ImportWalletButton } from './ImportWalletButton'
import { SeedPhraseWordGrid } from './SeedPhraseWordGrid'

export type ImportSeedSurface = 'popup' | 'sidepanel'

export type ImportSeedScreenProps = {
  surface: ImportSeedSurface
  step: 'phrase' | 'encrypt'
  words: string[]
  onWordChange: (index: number, value: string) => void
  onPasteWords: (text: string, startIndex: number) => void
  isValidPhrase: boolean
  onBack: () => void
  onProceedToEncrypt: () => void
  encryptionPassword: string
  encryptionConfirm: string
  onEncryptionPasswordChange: (v: string) => void
  onEncryptionConfirmChange: (v: string) => void
  onImport: () => void
  onEncryptBack: () => void
  importError?: string | null
  busy?: boolean
}

export function ImportSeedScreen({
  surface,
  step,
  words,
  onWordChange,
  onPasteWords,
  isValidPhrase,
  onBack,
  onProceedToEncrypt,
  encryptionPassword,
  encryptionConfirm,
  onEncryptionPasswordChange,
  onEncryptionConfirmChange,
  onImport,
  onEncryptBack,
  importError,
  busy,
}: ImportSeedScreenProps) {
  const compact = surface === 'popup'
  const [phraseError, setPhraseError] = useState<string | null>(null)

  if (step === 'encrypt') {
    return (
      <ImportSeedEncryptionForm
        password={encryptionPassword}
        confirmPassword={encryptionConfirm}
        onPasswordChange={onEncryptionPasswordChange}
        onConfirmChange={onEncryptionConfirmChange}
        onSubmit={onImport}
        onBack={onEncryptBack}
        error={importError}
        busy={busy}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ImportSeedBackButton onBack={onBack} />
      <ImportSeedLogo />
      <ImportSeedHeading />
      <div className={compact ? 'mt-4' : 'mt-6'}>
        <SeedPhraseWordGrid
          words={words}
          onWordChange={onWordChange}
          onPasteWords={onPasteWords}
          compact={compact}
        />
      </div>
      {phraseError ? (
        <p className="mt-3 text-center text-xs font-bold text-red-300">{phraseError}</p>
      ) : null}
      <div className={compact ? 'mt-5' : 'mt-8'}>
        <ImportWalletButton
          disabled={!isValidPhrase}
          onClick={() => {
            if (!isValidPhrase) {
              setPhraseError('Enter a valid 12-word recovery phrase.')
              return
            }
            setPhraseError(null)
            onProceedToEncrypt()
          }}
        />
      </div>
    </div>
  )
}
