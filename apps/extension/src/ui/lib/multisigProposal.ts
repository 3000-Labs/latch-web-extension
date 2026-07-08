import type {
  CreateMultisigProposalRequest,
  CreateMultisigProposalResponse,
  SetupSendRulesRequest,
  SetupSendRulesResponse,
  SmartAccountBalanceRow,
  StoredAccount,
} from '@latch/types'

import { friendlyError, sendToBackground } from './backgroundClient'
import { findReusablePasskeyAccount } from './multisigPasskey'
import { signAndSubmitBuiltTx } from './signBuiltTx'
import {
  buildSetupRequestFromDraft,
  isNoContextRuleError,
  passkeySetupPrerequisiteError,
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
    requireMatchedContextRule: true,
  }
}

/** First-send setup for multisig: configure SAC context rules, then create the proposal. */
export async function createMultisigSendProposalWithSetup(args: {
  draft: SendDraft
  multisigAccount: StoredAccount
  accounts: StoredAccount[]
  priceUsd: number | null
  surface: 'popup' | 'sidepanel'
  onProgress: (label: string | null) => void
}): Promise<CreateMultisigProposalResponse> {
  const signingPasskey = findReusablePasskeyAccount(args.accounts)
  if (!signingPasskey) {
    throw new Error(
      'No passkey account is available to set up sending for this multisig wallet. Sign in with a passkey first.'
    )
  }

  const proposalBody = buildCreateSendProposalRequest(
    args.draft,
    args.multisigAccount,
    args.priceUsd
  )
  const setupBody = buildSetupRequestFromDraft(
    args.draft,
    args.multisigAccount,
    signingPasskey
  )
  if (!proposalBody) throw new Error('Invalid send details')
  if (!setupBody) {
    throw new Error(
      passkeySetupPrerequisiteError(signingPasskey) ??
        'Cannot build send setup for this multisig wallet.'
    )
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    args.onProgress('Creating proposal…')
    const createRes = await sendToBackground<
      CreateMultisigProposalRequest,
      CreateMultisigProposalResponse
    >({
      type: 'MULTISIG_CREATE_PROPOSAL',
      payload: proposalBody,
    })

    if (createRes.ok && createRes.data) return createRes.data

    if (isNoContextRuleError(createRes.error)) {
      args.onProgress('Setting up send rules…')
      const setupRes = await sendToBackground<SetupSendRulesRequest, SetupSendRulesResponse>({
        type: 'SETUP_SEND_RULES',
        payload: setupBody,
      })
      if (!setupRes.ok) throw new Error(friendlyError(setupRes.error))
      const setup = setupRes.data!
      if (!setup.alreadyConfigured) {
        await signAndSubmitBuiltTx({
          build: setup,
          activeAccount: args.multisigAccount,
          signingAccount: signingPasskey,
          surface: args.surface,
          onProgress: (label) => args.onProgress(label),
        })
      }
      if ((setup.remainingSetupCount ?? 0) > 0) continue
      continue
    }

    throw new Error(friendlyError(createRes.error))
  }

  throw new Error('Send setup did not complete for this multisig wallet.')
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
