import React from 'react'

import type { MultisigProposalDetail } from '@latch/types'

import { OnboardingPrimaryButton } from '../../onboarding/components/OnboardingCardButtons'
import { proposalSummaryFromRow } from '../../lib/multisigProposal'
import { proposalReadyToExecute } from '../../lib/multisigApprove'

import { MultisigBackHeader } from './MultisigBackHeader'

export function MultisigProposalDetailScreen({
  proposal,
  loading: _loading,
  error,
  busy,
  needsMyApproval,
  approveLabel,
  approveBusyLabel,
  onBack,
  onApprove,
  onExecute,
  onRefresh,
}: {
  proposal: MultisigProposalDetail | null
  loading: boolean
  error: string | null
  busy: boolean
  needsMyApproval: boolean
  approveLabel?: string
  approveBusyLabel?: string
  onBack: () => void
  onApprove: () => void
  onExecute: () => void
  onRefresh: () => void
}) {
  const ready = proposal ? proposalReadyToExecute(proposal) : false

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <MultisigBackHeader onBack={onBack} />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {proposal ? (
        <>
          <div>
            <h1 className="text-[22px] font-semibold text-[#fcfcfc]">Proposal</h1>
            <p className="mt-2 text-base text-[#b3b3b3]">{proposalSummaryFromRow(proposal)}</p>
            <p className="mt-1 text-sm capitalize text-[#b3b3b3]">{proposal.status ?? 'pending'}</p>
            {proposal.threshold != null ? (
              <p className="mt-2 text-sm text-primary">
                {proposal.approvalCount ?? proposal.approvals?.length ?? 0}/{proposal.threshold}{' '}
                approvals
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex flex-col gap-3">
            {needsMyApproval ? (
              <OnboardingPrimaryButton disabled={busy} onClick={onApprove}>
                {busy ? (approveBusyLabel ?? 'Signing…') : (approveLabel ?? 'Approve')}
              </OnboardingPrimaryButton>
            ) : null}
            {ready ? (
              <OnboardingPrimaryButton disabled={busy} onClick={onExecute}>
                {busy ? 'Submitting…' : 'Execute transaction'}
              </OnboardingPrimaryButton>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={onRefresh}
              className="text-sm font-medium text-[#b3b3b3]"
            >
              Refresh simulation
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
