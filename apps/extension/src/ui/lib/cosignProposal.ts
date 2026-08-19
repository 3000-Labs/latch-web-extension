import type {
  BuildSendTxResponse,
  CreateMultisigProposalResponse,
  StoredAccount,
} from '@latch/types'

import { friendlyError, sendToBackground } from './backgroundClient'
import { apiProposeCosign } from './cosignFlow'
import { findReusablePasskeyAccount } from './multisigPasskey'
import { signAndSubmitBuiltTx } from './signBuiltTx'
import { buildSetupRequestFromDraft, passkeySetupPrerequisiteError } from './sendTx'
import type { SendDraft } from '../types/send'
import { buildCreateSendProposalRequest } from './multisigProposal'

export async function createCosignSendProposalWithSetup(args: {
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

  const setupBody = buildSetupRequestFromDraft(args.draft, args.multisigAccount, signingPasskey)
  if (!setupBody) {
    throw new Error(
      passkeySetupPrerequisiteError(signingPasskey) ??
        'Cannot build send setup for this multisig wallet.'
    )
  }

  const buildSend = async (): Promise<BuildSendTxResponse> => {
    const proposalBody = buildCreateSendProposalRequest(
      args.draft,
      args.multisigAccount,
      args.priceUsd
    )
    if (!proposalBody) throw new Error('Invalid send details')
    const buildRes = await sendToBackground<
      import('@latch/types').BuildSendTxRequest,
      BuildSendTxResponse
    >({
      type: 'BUILD_SEND_TX',
      payload: {
        smartAccountAddress: args.multisigAccount.smartAccountAddress,
        signerType: 'passkey',
        recipient: proposalBody.recipient!,
        amount: proposalBody.amount!,
        assetId: proposalBody.assetId,
        contractId: proposalBody.tokenContractId,
      },
    })
    if (!buildRes.ok || !buildRes.data) throw new Error(friendlyError(buildRes.error))
    return buildRes.data
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    args.onProgress('Creating proposal…')
    try {
      const build = await buildSend()
      const unsignedTxXdr =
        (build.unsignedTxXdr as string | undefined)?.trim() ?? build.txXdr?.trim()
      if (!unsignedTxXdr) throw new Error('Build did not return unsigned transaction XDR')
      const threshold = args.multisigAccount.multisigThreshold ?? 2
      const network =
        process.env.PLASMO_PUBLIC_STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
      const cosignReq = await apiProposeCosign({
        smartAccountAddress: args.multisigAccount.smartAccountAddress,
        unsignedTxXdr,
        network,
        threshold,
      })
      return {
        id: cosignReq.id,
        status: cosignReq.status,
        threshold: cosignReq.threshold,
        approvalCount: cosignReq.signature_count,
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('NO_CONTEXT_RULE') && !msg.includes('context rule')) throw e
    }

    args.onProgress('Setting up send rules…')
    const setupRes = await sendToBackground<
      import('@latch/types').SetupSendRulesRequest,
      import('@latch/types').SetupSendRulesResponse
    >({
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
  }

  throw new Error('Failed to create cosign proposal after setup')
}
