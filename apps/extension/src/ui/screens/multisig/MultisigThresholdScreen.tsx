import React, { useMemo, useState } from 'react'

import { OnboardingPrimaryButton } from '../../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../../onboarding/components/OnboardingSmallEmblem'

import { MultisigBackHeader } from './MultisigBackHeader'

export function MultisigThresholdScreen({
  memberCount,
  initialThreshold,
  onBack,
  onContinue,
}: {
  memberCount: number
  initialThreshold?: number
  onBack: () => void
  onContinue: (threshold: number) => void
}) {
  const max = Math.max(memberCount, 1)
  const [threshold, setThreshold] = useState(initialThreshold ?? Math.min(2, max))

  const options = useMemo(() => Array.from({ length: max }, (_, i) => i + 1), [max])

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6">
      <MultisigBackHeader onBack={onBack} />
      <div className="flex w-full shrink-0 flex-col items-center gap-2">
        <OnboardingSmallEmblem />
        <div className="flex w-full flex-col gap-2 text-center">
          <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
            Signature threshold
          </h1>
          <p className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
            How many owners must approve each transaction?
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex flex-col gap-3">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setThreshold(n)}
              className={[
                'flex w-full items-center justify-between rounded-[14px] border px-4 py-4 text-left',
                threshold === n
                  ? 'border-primary bg-[rgba(255,173,0,0.08)]'
                  : 'border-[#383838] bg-[#2a2928]',
              ].join(' ')}
            >
              <span className="text-base font-semibold text-[#fcfcfc]">
                {n} of {memberCount}
              </span>
              {threshold === n ? (
                <span className="text-xs font-medium text-primary">Selected</span>
              ) : null}
            </button>
          ))}
        </div>

        <OnboardingPrimaryButton onClick={() => onContinue(threshold)}>
          Continue
        </OnboardingPrimaryButton>
      </div>
    </div>
  )
}
