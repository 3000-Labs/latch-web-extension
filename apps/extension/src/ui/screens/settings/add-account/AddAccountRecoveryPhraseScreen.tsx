import {
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
} from '../../../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../../../onboarding/components/OnboardingSmallEmblem'
import { RecoveryPhraseGrid } from '../../../onboarding/components/RecoveryPhraseGrid'
import { AddAccountBackHeader } from './AddAccountBackHeader'

export function AddAccountRecoveryPhraseScreen({
  words,
  onWordChange,
  onPasteWords,
  isValidPhrase,
  onImportWallet,
  onBack,
}: {
  words: string[]
  onWordChange: (index: number, value: string) => void
  onPasteWords: (text: string, startIndex: number) => void
  isValidPhrase: boolean
  onImportWallet: () => void
  onBack: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AddAccountBackHeader onBack={onBack} />

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
          cellClassName="bg-[#2a2928]"
        />

        {isValidPhrase ? (
          <OnboardingPrimaryButton onClick={onImportWallet}>Import Wallet</OnboardingPrimaryButton>
        ) : (
          <OnboardingSecondaryButton disabled>Import Wallet</OnboardingSecondaryButton>
        )}
      </div>
    </div>
  )
}
