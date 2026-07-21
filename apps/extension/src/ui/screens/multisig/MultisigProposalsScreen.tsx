import React from 'react'

import type { MultisigProposal } from '@latch/types'

import { proposalSummaryFromRow } from '../../lib/multisigProposal'

import { MultisigBackHeader } from './MultisigBackHeader'

export function MultisigProposalsScreen({
  proposals,
  loading,
  error,
  pendingCount,
  onBack,
  onOpenProposal,
}: {
  proposals: MultisigProposal[]
  loading: boolean
  error: string | null
  pendingCount: number
  onBack: () => void
  onOpenProposal: (id: string) => void
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <MultisigBackHeader onBack={onBack} />
      <div>
        <h1 className="text-[22px] font-semibold text-[#fcfcfc]">Proposals</h1>
        {pendingCount > 0 ? (
          <p className="mt-1 text-sm text-primary">
            {pendingCount} need{pendingCount === 1 ? 's' : ''} your signature
          </p>
        ) : (
          <p className="mt-1 text-sm text-[#b3b3b3]">Multisig transaction requests</p>
        )}
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {!loading && proposals.length === 0 ? (
          <p className="rounded-[14px] bg-[#2a2928] p-4 text-sm text-[#b3b3b3]">No proposals yet.</p>
        ) : null}
        {proposals.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpenProposal(p.id)}
            className="flex w-full flex-col gap-1 rounded-[14px] bg-[#2a2928] p-4 text-left"
          >
            <span className="text-base font-semibold text-[#fcfcfc]">
              {proposalSummaryFromRow(p)}
            </span>
            <span className="text-xs capitalize text-[#b3b3b3]">{p.status ?? 'pending'}</span>
            {p.threshold != null ? (
              <span className="text-xs text-primary">
                {(p.approvalCount ?? 0)}/{p.threshold} approvals
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}
