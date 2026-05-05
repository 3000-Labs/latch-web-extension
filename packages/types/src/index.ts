/**
 * @latch/types
 * Shared TypeScript types across all packages and apps.
 * No runtime code — types only.
 */

export type Network = 'testnet' | 'mainnet'

export interface SignTransactionRequest {
  xdr: string
  network: Network
  accountToSign: string
}

export interface SignTransactionResponse {
  signedXdr: string
}

export type AccountMode = 'freighter' | 'phantom' | 'passkey'

export interface StoredAccount {
  id: string
  mode: AccountMode

  /** Soroban smart account address */
  smartAccountAddress: string

  /**
   * Stellar G-address.
   * - required for Freighter delegated signing
   * - returned by backend for Phantom smart account
   */
  gAddress?: string

  /** 32-byte Ed25519 pubkey in hex (no 0x prefix), for Phantom */
  phantomPublicKeyHex?: string

  /** Base64url credential ID, for Passkey/WebAuthn */
  passkeyCredentialId?: string

  /**
   * Passkey keyDataHex as required by backend:
   * uncompressed P-256 pubkey (65 bytes) || credentialIdBytes
   */
  passkeyKeyDataHex?: string

  createdAt: number
}

export interface GetAccountsResponse {
  accounts: StoredAccount[]
  activeAccountId?: string
}

export interface SetActiveAccountRequest {
  accountId: string
}

export interface CreateOrConnectFreighterRequest {
  gAddress: string
}

export interface CreateOrConnectFreighterResponse {
  smartAccountAddress: string
  alreadyDeployed: boolean
}

export interface CreateOrConnectPhantomRequest {
  publicKeyHex: string
}

export interface CreateOrConnectPhantomResponse {
  smartAccountAddress: string
  gAddress: string
  alreadyDeployed: boolean
}

export interface CreateOrConnectPasskeyRequest {
  keyDataHex: string
  credentialId: string
}

export interface CreateOrConnectPasskeyResponse {
  smartAccountAddress: string
  alreadyDeployed: boolean
}

export interface BuildTxRequest {
  smartAccountAddress: string
  signerG?: string
}

export interface BuildTxResponse {
  txXdr: string
  authEntryXdr: string
  authDigestHex: string
  contextRuleId: string
  validUntilLedger: number
  // allow backend to add more fields without breaking
  [k: string]: unknown
}

export interface BuildDelegatedTxRequest {
  smartAccountAddress: string
  gAddress: string
}

export interface BuildDelegatedTxResponse {
  txXdr: string
  smartAccountAuthEntryXdr: string
  gAddressPreimageXdr: string
  gAddressEntryTemplateXdr: string
  authDigestHex: string
}

export interface SubmitPhantomTxRequest {
  txXdr: string
  authEntryXdr: string
  authSignatureHex: string
  prefixedMessage: string
  publicKeyHex: string
}

export interface SubmitDelegatedTxRequest {
  txXdr: string
  smartAccountAuthEntryXdr: string
  gAddressEntryTemplateXdr: string
  signedAuthEntryBase64: string
  signerAddress: string
}

export interface SubmitWebauthnTxRequest {
  txXdr: string
  authEntryXdr: string
  sigDataXdr: string
  keyDataHex: string
  contextRuleId: string
}

export interface SubmitTxResponse {
  // backend response is not specified; accept opaque
  [k: string]: unknown
}

export type DappPermission = 'getPublicKey' | 'signTransaction'

export type PendingDappRequestKind = DappPermission

export interface PendingDappRequest {
  id: string
  origin: string
  kind: PendingDappRequestKind
  createdAt: number
}

export type ListPendingDappRequestsRequest = Record<string, never>

export interface ListPendingDappRequestsResponse {
  requests: PendingDappRequest[]
}

export interface ResolvePendingDappRequest {
  requestId: string
  approved: boolean
  signedXdr?: string
}

export interface GetDappPermissionsRequest {
  origin: string
}

export interface GetDappPermissionsResponse {
  origin: string
  allowed: DappPermission[]
}

export interface SetDappPermissionsRequest {
  origin: string
  allowed: DappPermission[]
}

export interface DappGetPublicKeyResponse {
  publicKey: string
}

export interface DappSignTransactionRequest {
  request: SignTransactionRequest
}

export interface DappSignTransactionResponse {
  response: SignTransactionResponse
}

export interface SerializableError {
  message: string
  code?: string
  status?: number
}

// Message types for popup/content ↔ background communication
export type MessageType =
  | 'SIGN_TRANSACTION'
  | 'GET_PUBLIC_KEY'
  | 'UNLOCK_VAULT'
  | 'LOCK_VAULT'
  | 'GET_SETUP_STATE'
  | 'SET_SETUP_STATE'
  | 'GET_ACCOUNTS'
  | 'SET_ACTIVE_ACCOUNT'
  | 'CREATE_OR_CONNECT_FREIGHTER'
  | 'CREATE_OR_CONNECT_PHANTOM'
  | 'CREATE_OR_CONNECT_PASSKEY'
  | 'BUILD_TX'
  | 'BUILD_DELEGATED_TX'
  | 'SUBMIT_TX_PHANTOM'
  | 'SUBMIT_TX_DELEGATED'
  | 'SUBMIT_TX_WEBAUTHN'
  | 'GET_DAPP_PERMISSIONS'
  | 'SET_DAPP_PERMISSIONS'
  | 'LIST_PENDING_DAPP_REQUESTS'
  | 'RESOLVE_PENDING_DAPP_REQUEST'
  | 'DAPP_GET_PUBLIC_KEY'
  | 'DAPP_SIGN_TRANSACTION'

export type SetupState = 'new' | 'onboarding_done' | 'has_account'

export interface BackgroundMessage<T = unknown> {
  type: MessageType
  payload: T
}

export interface BackgroundResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: SerializableError
}

export interface GetSetupStateResponse {
  setupState: SetupState
  accountPublicKey?: string
}

export interface SetSetupStateRequest {
  setupState: SetupState
  accountPublicKey?: string
}

export type BackgroundRequestPayloadByType = {
  GET_SETUP_STATE: undefined
  SET_SETUP_STATE: SetSetupStateRequest
  GET_ACCOUNTS: undefined
  SET_ACTIVE_ACCOUNT: SetActiveAccountRequest
  CREATE_OR_CONNECT_FREIGHTER: CreateOrConnectFreighterRequest
  CREATE_OR_CONNECT_PHANTOM: CreateOrConnectPhantomRequest
  CREATE_OR_CONNECT_PASSKEY: CreateOrConnectPasskeyRequest
  BUILD_TX: BuildTxRequest
  BUILD_DELEGATED_TX: BuildDelegatedTxRequest
  SUBMIT_TX_PHANTOM: SubmitPhantomTxRequest
  SUBMIT_TX_DELEGATED: SubmitDelegatedTxRequest
  SUBMIT_TX_WEBAUTHN: SubmitWebauthnTxRequest
  GET_DAPP_PERMISSIONS: GetDappPermissionsRequest
  SET_DAPP_PERMISSIONS: SetDappPermissionsRequest
  LIST_PENDING_DAPP_REQUESTS: ListPendingDappRequestsRequest
  RESOLVE_PENDING_DAPP_REQUEST: ResolvePendingDappRequest
  DAPP_GET_PUBLIC_KEY: GetDappPermissionsRequest
  DAPP_SIGN_TRANSACTION: DappSignTransactionRequest
} & Record<string, unknown>

export type BackgroundResponseDataByType = {
  GET_SETUP_STATE: GetSetupStateResponse
  SET_SETUP_STATE: undefined
  GET_ACCOUNTS: GetAccountsResponse
  SET_ACTIVE_ACCOUNT: undefined
  CREATE_OR_CONNECT_FREIGHTER: CreateOrConnectFreighterResponse & { account: StoredAccount }
  CREATE_OR_CONNECT_PHANTOM: CreateOrConnectPhantomResponse & { account: StoredAccount }
  CREATE_OR_CONNECT_PASSKEY: CreateOrConnectPasskeyResponse & { account: StoredAccount }
  BUILD_TX: BuildTxResponse
  BUILD_DELEGATED_TX: BuildDelegatedTxResponse
  SUBMIT_TX_PHANTOM: SubmitTxResponse
  SUBMIT_TX_DELEGATED: SubmitTxResponse
  SUBMIT_TX_WEBAUTHN: SubmitTxResponse
  GET_DAPP_PERMISSIONS: GetDappPermissionsResponse
  SET_DAPP_PERMISSIONS: GetDappPermissionsResponse
  LIST_PENDING_DAPP_REQUESTS: ListPendingDappRequestsResponse
  RESOLVE_PENDING_DAPP_REQUEST: undefined
  DAPP_GET_PUBLIC_KEY: DappGetPublicKeyResponse
  DAPP_SIGN_TRANSACTION: DappSignTransactionResponse
} & Record<string, unknown>
