import React, { useState } from 'react'

import { OnboardingPrimaryButton } from '../../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../../onboarding/components/OnboardingSmallEmblem'

import { MultisigBackHeader } from './MultisigBackHeader'

function MultisigField({
  id,
  label,
  optional,
  value,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  optional?: boolean
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-base font-semibold tracking-[-0.16px] text-[#fcfcfc]">
        {label}
        {optional ? <span className="font-light tracking-[-0.32px]"> (optional)</span> : null}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'h-[52px] w-full rounded-xl border border-[#383838] bg-transparent px-3 text-base leading-[1.36] tracking-[-0.32px] outline-none',
          value ? 'text-[#fcfcfc]' : 'text-[#fcfcfc] placeholder:text-[#b3b3b3]',
        ].join(' ')}
      />
    </div>
  )
}

export function CreateMultisigScreen({
  error,
  onBack,
  onContinue,
}: {
  error?: string | null
  onBack: () => void
  onContinue: (walletName: string, purpose: string) => void
}) {
  const [walletName, setWalletName] = useState('')
  const [purpose, setPurpose] = useState('')
  const canContinue = walletName.trim().length > 0

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6">
      <MultisigBackHeader onBack={onBack} />
      <div className="flex w-full shrink-0 flex-col items-center gap-2">
        <OnboardingSmallEmblem />
        <div className="flex w-full flex-col gap-2 text-center">
          <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
            Multisig Account
          </h1>
          <p className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
            Secure transactions with shared approvals.
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col gap-3">
          <MultisigField
            id="multisig-wallet-name"
            label="Wallet Name"
            value={walletName}
            onChange={setWalletName}
          />
          <MultisigField
            id="multisig-purpose"
            label="Purpose"
            optional
            value={purpose}
            placeholder="What will this wallet be used for?"
            onChange={setPurpose}
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <OnboardingPrimaryButton
          disabled={!canContinue}
          onClick={() => onContinue(walletName.trim(), purpose.trim())}
        >
          Continue
        </OnboardingPrimaryButton>
      </div>
    </div>
  )
}
