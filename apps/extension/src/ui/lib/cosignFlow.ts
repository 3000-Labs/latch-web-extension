import type {
  CosignMemberInit,
  CosignRequest,
  MultisigPredictResponse,
  MultisigSignerInitRequest,
  StoredAccount,
} from '@latch/types'

import { friendlyError, sendToBackground } from './backgroundClient'
import { normalizeMultisigSignerInitForApi } from '../../lib/multisigSignerInit'
import { ensureCosignV1Auth } from './cosignV1Auth'

export function newInviteToken(): string {
  return crypto.randomUUID()
}

export function newAccountSaltHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function buildGAddressSigner(label: string, gAddress: string): CosignMemberInit {
  return { type: 'delegated', label, gAddress: gAddress.trim() }
}

export function buildPasskeySigner(
  label: string,
  keyDataHex: string,
  _credentialId?: string
): CosignMemberInit {
  return {
    type: 'passkey',
    label,
    keyDataHex: keyDataHex.trim(),
  }
}

export function toDeploySigners(members: CosignMemberInit[]): MultisigSignerInitRequest[] {
  return members.map((m) => {
    let signer: MultisigSignerInitRequest
    if (m.gAddress?.trim()) {
      signer = { type: 'delegated', label: m.label, gAddress: m.gAddress.trim() }
    } else if (m.keyDataHex?.trim()) {
      signer = { type: 'passkey', label: m.label, keyDataHex: m.keyDataHex.trim() }
    } else {
      throw new Error(`Member ${m.label ?? '?'} is missing signer material`)
    }
    return normalizeMultisigSignerInitForApi(signer)
  })
}

export async function apiPredictCosignAccount(args: {
  threshold: number
  signers: MultisigSignerInitRequest[]
  accountSaltHex: string
}): Promise<MultisigPredictResponse> {
  const res = await sendToBackground<typeof args, MultisigPredictResponse>({
    type: 'COSIGN_PREDICT_ACCOUNT',
    payload: args,
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data
}

export async function apiPredictFromMembers(
  threshold: number,
  members: CosignMemberInit[],
  accountSaltHex: string
): Promise<MultisigPredictResponse> {
  return apiPredictCosignAccount({
    threshold,
    signers: toDeploySigners(members),
    accountSaltHex,
  })
}

export async function apiDeployCosignWallet(args: {
  threshold: number
  signers: MultisigSignerInitRequest[]
  accountSaltHex: string
  walletName: string
  inviteToken: string
  creatorLinkedAccountId: string
}) {
  const res = await sendToBackground<
    typeof args,
    import('@latch/types').CosignDeployAccountResponse
  >({
    type: 'COSIGN_DEPLOY_ACCOUNT',
    payload: args,
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data
}

export async function apiGetTransportPubkey(): Promise<string> {
  const res = await sendToBackground<
    undefined,
    import('@latch/types').CosignGetTransportPubkeyResponse
  >({
    type: 'COSIGN_GET_TRANSPORT_PUBKEY',
    payload: undefined,
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data.pubkeyB64
}

export async function apiPostJoinRelay(args: {
  inviteToken: string
  linkedAccountId: string
  memberBlindId: string
  transportPubkeyB64: string
}) {
  const res = await sendToBackground<typeof args, { message: string }>({
    type: 'COSIGN_POST_JOIN_RELAY',
    payload: args,
  })
  if (!res.ok) throw new Error(friendlyError(res.error))
}

export async function apiPollJoinRelay(inviteToken: string) {
  const res = await sendToBackground<
    { inviteToken: string },
    import('@latch/types').JoinRelayRecord | null
  >({
    type: 'COSIGN_POLL_JOIN_RELAY',
    payload: { inviteToken },
  })
  if (!res.ok) throw new Error(friendlyError(res.error))
  return res.data ?? null
}

export async function apiSealMemberWck(args: {
  inviteToken: string
  walletRef: string
  memberBlindId: string
  transportPubkeyB64: string
}) {
  const res = await sendToBackground<typeof args, { message: string }>({
    type: 'COSIGN_SEAL_MEMBER_WCK',
    payload: args,
  })
  if (!res.ok) throw new Error(friendlyError(res.error))
}

export async function apiEnsureCosignV1Auth(args: {
  linkedAccountId: string
  passkeyCredentialId?: string
  surface: 'popup' | 'sidepanel'
}) {
  await ensureCosignV1Auth(args)
}

export async function apiGetCosignProposalsBannerDismissed(): Promise<string[]> {
  const res = await sendToBackground<undefined, { accountIds: string[] }>({
    type: 'COSIGN_GET_PROPOSALS_BANNER_DISMISSED',
    payload: undefined,
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data.accountIds ?? []
}

export async function apiDismissCosignProposalsBanner(accountId: string): Promise<void> {
  const res = await sendToBackground<{ accountId: string }, { accountIds: string[] }>({
    type: 'COSIGN_DISMISS_PROPOSALS_BANNER',
    payload: { accountId },
  })
  if (!res.ok) throw new Error(friendlyError(res.error))
}

export async function apiDiscoverMemberships(linkedAccountId: string) {
  const res = await sendToBackground<
    { linkedAccountId: string },
    import('@latch/types').CosignDiscoverResponse
  >({
    type: 'COSIGN_DISCOVER_MEMBERSHIPS',
    payload: { linkedAccountId },
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data
}

export async function apiListCosignPending(smartAccountAddress: string): Promise<CosignRequest[]> {
  const res = await sendToBackground<
    { smartAccountAddress: string },
    import('@latch/types').CosignListPendingResponse
  >({
    type: 'COSIGN_LIST_PENDING',
    payload: { smartAccountAddress },
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data.requests ?? []
}

export async function apiGetCosignRequest(requestId: string): Promise<CosignRequest> {
  const res = await sendToBackground<{ requestId: string }, CosignRequest>({
    type: 'COSIGN_GET_REQUEST',
    payload: { requestId },
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data
}

export async function apiProposeCosign(args: {
  smartAccountAddress: string
  unsignedTxXdr: string
  network: string
  threshold: number
}): Promise<CosignRequest> {
  const res = await sendToBackground<typeof args, CosignRequest>({
    type: 'COSIGN_PROPOSE',
    payload: args,
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data
}

export async function apiSignCosignRequest(args: {
  requestId: string
  smartAccountAddress: string
  linkedAccountId: string
  signedAuthEntryBase64: string
}): Promise<CosignRequest> {
  const res = await sendToBackground<typeof args, CosignRequest>({
    type: 'COSIGN_SIGN_REQUEST',
    payload: args,
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data
}

export async function apiExecuteCosignRequest(args: {
  requestId: string
  smartAccountAddress: string
}) {
  const res = await sendToBackground<
    typeof args,
    import('@latch/types').CosignExecuteResponse
  >({
    type: 'COSIGN_EXECUTE_REQUEST',
    payload: args,
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data
}

export function cosignNeedsMyApproval(
  request: CosignRequest,
  blindSignerId: string | undefined
): boolean {
  if (!blindSignerId || request.status === 'submitted' || request.status === 'cancelled') {
    return false
  }
  return !(request.signatures ?? []).some((s) => s.blind_signer_id === blindSignerId)
}

export function cosignReadyToExecute(request: CosignRequest): boolean {
  return (
    request.signature_count >= request.threshold &&
    request.status !== 'submitted' &&
    request.status !== 'cancelled'
  )
}

export function findLinkedAccount(
  accounts: StoredAccount[],
  multisig: StoredAccount
): StoredAccount | undefined {
  if (!multisig.cosignLinkedAccountId) return undefined
  return accounts.find((a) => a.id === multisig.cosignLinkedAccountId)
}

/** Drop any legacy `/api/multisig/drafts` session metadata before a cosign create wizard. */
export async function apiClearMultisigDraftMeta(): Promise<void> {
  const res = await sendToBackground({
    type: 'MULTISIG_CLEAR_DRAFT_META',
    payload: undefined,
  })
  if (!res.ok) throw new Error(friendlyError(res.error))
}
