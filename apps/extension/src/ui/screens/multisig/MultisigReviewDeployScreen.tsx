import React, { useEffect, useState } from 'react'

import type { MultisigPredictResponse } from '@latch/types'

import { OnboardingPrimaryButton } from '../../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../../onboarding/components/OnboardingSmallEmblem'

function truncateAddress(address: string) {
  if (address.length <= 16) return address
  return `${address.slice(0, 6)}…${address.slice(-6)}`
}

export function MultisigReviewDeployScreen({
  walletName,
  threshold,
  memberCount,
  predicted,
  predictLoading,
  predictError,
  deployBusy,
  deployError,
  onBack,
  onDeploy,
}: {
  walletName: string
  threshold: number
  memberCount: number
  predicted: MultisigPredictResponse | null
  predictLoading: boolean
  predictError: string | null
  deployBusy: boolean
  deployError: string | null
  onBack: () => void
  onDeploy: () => void
}) {
  const [copied, setCopied] = useState(false)
  const address = predicted?.smartAccountAddress ?? ''

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6">
      <button type="button" onClick={onBack} className="self-start text-sm text-[#b3b3b3]">
        Back
      </button>
      <div className="flex w-full shrink-0 flex-col items-center gap-2">
        <OnboardingSmallEmblem />
        <div className="flex w-full flex-col gap-2 text-center">
          <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
            Review & deploy
          </h1>
          <p className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
            Deploy your multisig wallet on-chain.
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-4">
        <div className="flex flex-col gap-3 rounded-[14px] border border-[#383838] bg-[#2a2928] p-4">
          <Row label="Name" value={walletName} />
          <Row label="Threshold" value={`${threshold} of ${memberCount}`} />
          <div className="flex flex-col gap-1">
            <span className="text-sm text-[#b3b3b3]">Predicted address</span>
            {predictLoading ? (
              <span className="text-base text-[#fcfcfc]">Computing…</span>
            ) : predictError ? (
              <span className="text-sm text-red-400">{predictError}</span>
            ) : address ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[#fcfcfc]">{truncateAddress(address)}</span>
                <button
                  type="button"
                  className="text-xs font-medium text-primary"
                  onClick={() => {
                    void navigator.clipboard.writeText(address).then(() => setCopied(true))
                  }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            ) : (
              <span className="text-sm text-[#b3b3b3]">—</span>
            )}
          </div>
        </div>

        {deployError ? <p className="text-sm text-red-400">{deployError}</p> : null}

        <OnboardingPrimaryButton disabled={deployBusy || predictLoading || !address} onClick={onDeploy}>
          {deployBusy ? 'Deploying…' : 'Deploy multisig wallet'}
        </OnboardingPrimaryButton>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-[#b3b3b3]">{label}</span>
      <span className="text-base font-semibold text-[#fcfcfc]">{value}</span>
    </div>
  )
}
