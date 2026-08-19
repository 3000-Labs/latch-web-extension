/**
 * Cosign queue types — JWT `/v1/*` blind-index multisig coordination.
 * See references/multisig-cosign-flow 2.md and LATCH_BACKEND_COSIGN_EXTENSION.md.
 */

import type { MultisigSignerInitRequest } from './multisig'
import type { StoredAccount } from './index'

/** Local cosign owner row (WCK secret lives in background storage only). */
export interface CosignWalletRecord {
  id: string
  walletRef: string
  wckHex: string
  threshold: number
  label: string
  linkedSignerAccountId: string
  accountSaltHex?: string
  membersSnapshot?: CosignMemberInit[]
  createdAt: number
}

export interface CosignMemberInit extends MultisigSignerInitRequest {
  label?: string
  memberBlindId?: string
}

export interface CosignSignature {
  id: string
  blind_signer_id: string
  auth_entry_xdr: string
  created_at: string
}

export type CosignRequestStatus = 'pending' | 'submitted' | 'cancelled' | 'expired'

export interface CosignRequest {
  id: string
  queue_index: string
  unsigned_tx_xdr: string
  network: string
  threshold: number
  status: CosignRequestStatus
  submitted_tx_hash: string
  expires_at: string
  created_at: string
  updated_at: string
  signatures: CosignSignature[]
  signature_count: number
}

export interface WalletMembership {
  wallet_ref: string
  created_at: string
}

export interface JoinRelayRecord {
  invite_token: string
  transport_pubkey_b64: string
  member_blind_id?: string
  created_at: string
  updated_at?: string
}

export interface PostJoinRelayRequest {
  invite_token: string
  transport_pubkey_b64: string
  member_blind_id?: string
}

export interface AnnounceMembershipRequest {
  wallet_ref: string
  member_blind_ids: string[]
}

export interface CreateCosignRequestInput {
  queueIndex: string
  unsignedTxXdr: string
  network: string
  threshold: number
}

export interface AddCosignSignatureRequest {
  requestId: string
  blindSignerId: string
  authEntryXdr: string
}

export interface CosignLocalWizardState {
  walletName: string
  purpose: string
  threshold: number
  signers: CosignMemberInit[]
  accountSaltHex: string
  inviteToken: string
  smartAccountAddress?: string
  creatorLinkedAccountId?: string
}

export interface CosignDiscoverRequest {
  linkedAccountId: string
}

export interface CosignDiscoverResponse {
  discovered: CosignWalletRecord[]
  accounts: StoredAccount[]
}

export interface CosignListPendingRequest {
  smartAccountAddress: string
}

export interface CosignListPendingResponse {
  requests: CosignRequest[]
}

export interface CosignGetRequestPayload {
  requestId: string
}

export interface CosignProposeRequest {
  smartAccountAddress: string
  unsignedTxXdr: string
  network: string
  threshold: number
}

export interface CosignSignRequest {
  requestId: string
  smartAccountAddress: string
  linkedAccountId: string
  /** WebAuthn assertion pieces when signing in UI before background submit. */
  sigDataXdrHex?: string
  signedAuthEntryBase64?: string
  signerAddress?: string
}

export interface CosignExecuteRequest {
  requestId: string
  smartAccountAddress: string
}

export interface CosignExecuteResponse {
  txHash: string
  request: CosignRequest
}

export interface CosignDeployAccountRequest {
  threshold: number
  signers: MultisigSignerInitRequest[]
  accountSaltHex: string
  walletName: string
  inviteToken: string
  creatorLinkedAccountId: string
}

export interface CosignDeployAccountResponse {
  smartAccountAddress: string
  accountSaltHex: string
  wckRecordId: string
  account: StoredAccount
}

export interface CosignCompleteMemberJoinRequest {
  inviteToken: string
  linkedAccountId: string
  memberBlindId: string
  transportPubkeyB64: string
}

export interface CosignPollJoinRelayRequest {
  inviteToken: string
}

export interface CosignSealMemberWckRequest {
  inviteToken: string
  walletRef: string
  memberBlindId: string
  transportPubkeyB64: string
}

export interface CosignHistoryRequest {
  cAddress: string
  network?: 'testnet' | 'mainnet'
  limit?: number
}

export interface CosignHistoryTransaction {
  hash: string
  [key: string]: unknown
}

export interface V1TokenPair {
  accessToken: string
  refreshToken: string
  expiresAt: number
  wallet: string
}

export interface CosignGetTransportPubkeyResponse {
  pubkeyB64: string
}
