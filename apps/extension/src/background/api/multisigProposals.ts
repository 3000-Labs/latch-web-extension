import type {
  CreateMultisigProposalRequest,
  CreateMultisigProposalResponse,
  MultisigApproveDelegatedFinishRequest,
  MultisigExecuteProposalResponse,
  MultisigProposalDetail,
  ListMultisigProposalsResponse,
} from '@latch/types'

import { latchFetch } from './client'
import { latchExtensionJsonBody } from './webauthn'
import { normalizeMultisigProposalDetail } from './multisigNormalize'

export async function listMultisigProposals(
  smartAccountAddress: string
): Promise<ListMultisigProposalsResponse> {
  const q = encodeURIComponent(smartAccountAddress)
  return await latchFetch<ListMultisigProposalsResponse>(
    `/api/multisig/proposals?account=${q}`,
    { method: 'GET' }
  )
}

export async function createMultisigProposal(
  req: CreateMultisigProposalRequest
): Promise<CreateMultisigProposalResponse> {
  return await latchFetch<CreateMultisigProposalResponse>('/api/multisig/proposals', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function getMultisigProposal(proposalId: string): Promise<MultisigProposalDetail> {
  const raw = await latchFetch<unknown>(
    `/api/multisig/proposals/${encodeURIComponent(proposalId)}`,
    { method: 'GET' }
  )
  return normalizeMultisigProposalDetail(raw)
}

export async function multisigProposalApproveDelegatedBegin(args: {
  proposalId: string
  memberId: string
}): Promise<Record<string, unknown>> {
  return await latchFetch<Record<string, unknown>>(
    `/api/multisig/proposals/${encodeURIComponent(args.proposalId)}/approve/delegated/begin`,
    {
      method: 'POST',
      body: JSON.stringify({ memberId: args.memberId }),
    }
  )
}

export async function multisigProposalApproveDelegatedFinish(
  req: MultisigApproveDelegatedFinishRequest
): Promise<MultisigProposalDetail> {
  const raw = await latchFetch<unknown>(
    `/api/multisig/proposals/${encodeURIComponent(req.proposalId)}/approve/delegated/finish`,
    {
      method: 'POST',
      body: JSON.stringify({
        memberId: req.memberId,
        signedAuthEntryBase64: req.signedAuthEntryBase64,
        signerAddress: req.signerAddress,
      }),
    }
  )
  return normalizeMultisigProposalDetail(raw)
}

export async function multisigProposalApproveWebauthn(args: {
  proposalId: string
  memberId: string
  sigDataXdrHex: string
}): Promise<MultisigProposalDetail> {
  const raw = await latchFetch<unknown>(
    `/api/multisig/proposals/${encodeURIComponent(args.proposalId)}/approve/webauthn`,
    {
      method: 'POST',
      body: latchExtensionJsonBody({
        memberId: args.memberId,
        sigDataXdrHex: args.sigDataXdrHex,
      }),
    }
  )
  return normalizeMultisigProposalDetail(raw)
}

export async function executeMultisigProposal(
  proposalId: string
): Promise<MultisigExecuteProposalResponse> {
  return await latchFetch<MultisigExecuteProposalResponse>(
    `/api/multisig/proposals/${encodeURIComponent(proposalId)}/execute`,
    { method: 'POST' }
  )
}

export async function refreshMultisigProposal(proposalId: string): Promise<MultisigProposalDetail> {
  const raw = await latchFetch<unknown>(
    `/api/multisig/proposals/${encodeURIComponent(proposalId)}/refresh`,
    { method: 'POST' }
  )
  return normalizeMultisigProposalDetail(raw)
}
