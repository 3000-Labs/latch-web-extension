import {
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
} from './components/OnboardingCardButtons'
import { OnboardingCardHeader } from './components/OnboardingCardHeader'
import { OnboardingSmallEmblem } from './components/OnboardingSmallEmblem'
import { OnboardingVerifyingLogo } from './components/OnboardingVerifyingLogo'
import { RecoveryPhraseGrid } from './components/RecoveryPhraseGrid'

export function OnboardingImportRecoveryPhraseCard({
  words,
  onWordChange,
  onPasteWords,
  isValidPhrase,
  verifying,
  onBack,
  onClose,
  onImportWallet,
}: {
  words: string[]
  onWordChange: (index: number, value: string) => void
  onPasteWords: (text: string, startIndex: number) => void
  isValidPhrase: boolean
  verifying: boolean
  onBack: () => void
  onClose: () => void
  onImportWallet: () => void
}) {
  return (
    <div className="relative flex h-[600px] w-[420px] flex-col gap-2 overflow-hidden rounded-[24px] bg-[#1c1c1c] p-6 shadow-[-5px_6px_7.7px_rgba(9,9,9,0.3)]">
      <OnboardingCardHeader onBack={onBack} onClose={onClose} />

      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="flex w-full shrink-0 flex-col items-center gap-2">
            <OnboardingSmallEmblem />
            <div className="flex w-full flex-col gap-2 text-center">
              <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
                Import Your Recovery Phrase
              </h1>
              <div className="text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
                <p>Enter your 12-word recovery phrase in the </p>
                <p>correct order</p>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-between">
            <RecoveryPhraseGrid
              words={words}
              onWordChange={onWordChange}
              onPasteWords={onPasteWords}
            />

            {isValidPhrase ? (
              <OnboardingPrimaryButton onClick={onImportWallet} disabled={verifying}>
                Import Wallet
              </OnboardingPrimaryButton>
            ) : (
              <OnboardingSecondaryButton disabled>Import Wallet</OnboardingSecondaryButton>
            )}
          </div>
        </div>
      </div>

      {verifying ? (
        <>
          <div
            className="absolute inset-0 bg-[#121212]/90"
            aria-hidden
          />
          <div className="absolute left-1/2 top-[calc(50%-0.33px)] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
            <OnboardingVerifyingLogo />
            <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fbfbfb]">
              Verifying...
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
