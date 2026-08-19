import type {
  CreateMultisigProposalRequest,
  CreateMultisigProposalResponse,
  SmartAccountBalanceRow,
  StoredAccount,
} from '@latch/types'

import { friendlyError, sendToBackground } from './backgroundClient'
import {
  sendCryptoAmountFromDraft,
} from './sendTx'
import type { SendDraft } from '../types/send'

export function buildCreateSendProposalRequest(
  draft: SendDraft,
  account: StoredAccount,
  priceUsd: number | null
): CreateMultisigProposalRequest | null {
  if (!account.smartAccountAddress || !draft.token || !draft.recipientAddress?.trim()) {
    return null
  }
  const amount = sendCryptoAmountFromDraft(draft, priceUsd)
  if (!amount) return null

  const tokenContractId = draft.token.sacContractId?.trim()
  if (!tokenContractId) return null

  let assetId = draft.token.assetId
  if (!assetId && draft.token.code.toUpperCase() === 'XLM') {
    assetId = 'native'
  }
  if (!assetId) {
    assetId = draft.token.code
  }

  return {
    smartAccountAddress: account.smartAccountAddress,
    operationKind: 'sac_transfer',
    recipient: draft.recipientAddress.trim(),
    amount,
    assetId,
    tokenContractId,
    // Backend currently does not support installing token-scoped context rules
    // for m-of-n multisig accounts. Use the default rule (id 0) instead.
    requireMatchedContextRule: false,
  }
}

/** Create a multisig send proposal via `/api/multisig/proposals`. */
export async function createMultisigSendProposalWithSetup(args: {
  draft: SendDraft
  multisigAccount: StoredAccount
  accounts: StoredAccount[]
  priceUsd: number | null
  surface: 'popup' | 'sidepanel'
  onProgress: (label: string | null) => void
}): Promise<CreateMultisigProposalResponse> {
  const proposalBody = buildCreateSendProposalRequest(
    args.draft,
    args.multisigAccount,
    args.priceUsd
  )
  if (!proposalBody) throw new Error('Invalid send details')

  args.onProgress('Creating proposal…')
  const createRes = await sendToBackground<CreateMultisigProposalRequest, CreateMultisigProposalResponse>(
    {
      type: 'MULTISIG_CREATE_PROPOSAL',
      payload: proposalBody,
    }
  )
  if (!createRes.ok) throw new Error(friendlyError(createRes.error))
  return createRes.data!
}

export function proposalSummaryFromRow(row: {
  operationKind?: string
  recipient?: string
  amount?: string
  assetId?: string
  status?: string
}): string {
  if (
    row.operationKind === 'sac_transfer' ||
    row.operationKind === 'send' ||
    row.recipient
  ) {
    const asset = row.assetId ?? 'asset'
    return `Send ${row.amount ?? '?'} ${asset} → ${truncate(row.recipient ?? '…')}`
  }
  return row.operationKind ?? 'Transaction'
}

function truncate(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

export function tokenFromPortfolioRow(row: SmartAccountBalanceRow | undefined, assetId?: string) {
  if (!row) return undefined
  if (assetId && row.assetId === assetId) return row
  if (assetId?.toUpperCase() === row.code.toUpperCase()) return row
  if (assetId === 'native' && row.code.toUpperCase() === 'XLM') return row
  return row
}
