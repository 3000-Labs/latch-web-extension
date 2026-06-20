import {
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
} from './components/OnboardingCardButtons'
import { OnboardingCardHeader } from './components/OnboardingCardHeader'
import { OnboardingSmallEmblem } from './components/OnboardingSmallEmblem'

export type ImportMethod = 'seedPhrase' | 'existingPasskey'

export function OnboardingHaveWalletCard({
  selected,
  onSelect,
  onBack,
  onClose,
  onContinue,
}: {
  selected: ImportMethod | null
  onSelect: (method: ImportMethod) => void
  onBack: () => void
  onClose: () => void
  onContinue: () => void
}) {
  const canContinue = selected !== null

  return (
    <div className="flex h-[600px] w-[420px] flex-col gap-2 rounded-[24px] bg-[#1c1c1c] p-6 shadow-[-5px_6px_7.7px_rgba(9,9,9,0.3)]">
      <OnboardingCardHeader onBack={onBack} onClose={onClose} />

      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="flex w-full shrink-0 flex-col items-center gap-2">
            <OnboardingSmallEmblem />
            <div className="flex w-full flex-col gap-2 text-center">
              <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
                I Have A Wallet
              </h1>
              <p className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
                Import the wallet you already have or connect an existing stellar wallet.
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-between">
            <div className="flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={() => onSelect('seedPhrase')}
                className={[
                  'w-full rounded-[14px] bg-[#201f1e] p-3 text-left',
                  selected === 'seedPhrase' ? 'border border-[#f0a300]' : 'border border-transparent',
                ].join(' ')}
              >
                <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
                  Import With Seed Phrase
                </p>
                <p className="mt-1.5 text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
                  Restore your account using your 12-word recovery phrase
                </p>
              </button>

              <button
                type="button"
                onClick={() => onSelect('existingPasskey')}
                className={[
                  'w-full rounded-[14px] bg-[#201f1e] p-3 text-left',
                  selected === 'existingPasskey'
                    ? 'border border-[#f0a300]'
                    : 'border border-transparent',
                ].join(' ')}
              >
                <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
                  Use Existing Passkey
                </p>
                <p className="mt-1.5 text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
                  Restore your account using a passkey you created previously
                </p>
              </button>
            </div>

            {canContinue ? (
              <OnboardingPrimaryButton onClick={onContinue}>Continue</OnboardingPrimaryButton>
            ) : (
              <OnboardingSecondaryButton disabled>Continue</OnboardingSecondaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
