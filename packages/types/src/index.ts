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
  txHash?: string
  signedAuthEntry?: string
  signedTxXdr?: string
  /** @deprecated Prefer txHash when wallet submits on behalf of dapp */
  signedXdr?: string
}

export type AccountMode = 'freighter' | 'phantom' | 'passkey' | 'mnemonic'

export interface StoredAccount {
  id: string
  mode: AccountMode

  /** Local-only user label (stored in chrome.storage.local). */
  label?: string

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
  /** Present when the active account is `mnemonic` and an encrypted seed exists (`remember`). */
  activeAccountHasMnemonicVault?: boolean
  /**
   * When active account is `mnemonic`, true if the seed signer is loaded in the service worker session
   * (unlocked or just imported). False when a vault exists but the SW was restarted and the user must unlock.
   */
  activeAccountMnemonicSignerLoaded?: boolean
}

/** One row for smart-account (C) Soroban SAC balances shown on Home. */
export interface SmartAccountBalanceRow {
  code: string
  issuer?: string
  sacContractId: string
  /** Catalog id from Latch API (e.g. `native`, `USDC`) for build-send. */
  assetId?: string
  /** SAC display decimals from API catalog. */
  decimals?: number
  /** Human-readable amount (trimmed), Soroban SAC 7 decimals for display. */
  amount: string
  /** data: URL resolved in background (CSP-safe for extension UI). */
  iconUrl?: string | null
  /** USD value from interim hardcoded prices (display string, 2 dp). */
  balanceUsd?: string
}

/** Balance entry from `GET /api/smart-account/balances`. */
export interface ApiSmartAccountBalance {
  assetId: string
  symbol: string
  name?: string
  contractId: string
  decimals: number
  balance: string
  balanceRaw?: string
}

export interface GetSmartAccountBalancesApiResponse {
  smartAccountAddress: string
  balances: ApiSmartAccountBalance[]
}

export type SendSignerType = 'passkey' | 'phantom' | 'freighter'

export interface BuildSendTxRequest {
  smartAccountAddress: string
  signerType: SendSignerType
  recipient: string
  amount: string
  assetId?: string
  contractId?: string
  signerG?: string
}

export interface BuildSendAssetInfo {
  assetId: string
  symbol: string
  contractId: string
  decimals: number
}

export interface BuildSendTxResponse {
  txXdr: string
  authEntryXdr: string
  authEntriesXdr?: string[]
  smartAccountAuthEntryIndex?: number
  contextRuleId: number | string
  authDigestHex: string
  signaturePayloadHex?: string
  validUntilLedger: number
  simulationResultXdr?: string
  asset?: BuildSendAssetInfo
  recipient?: string
  amount?: string
  amountRaw?: string
  /** Freighter / delegated path */
  smartAccountAuthEntryXdr?: string
  gAddressPreimageXdr?: string
  gAddressEntryTemplateXdr?: string
  estimatedFeeXlm?: string
  estimatedFeeUsd?: string
  feeLabel?: string
  [k: string]: unknown
}

export interface SetupSendRulesRequest {
  smartAccountAddress: string
  signerType: SendSignerType
  assetId?: string
  assetIds?: string[]
  publicKeyHex?: string
  /** WebAuthn verifier C-address (must match Latch API `NEXT_PUBLIC_WEBAUTHN_VERIFIER_ADDRESS`). */
  verifierAddress?: string
  keyDataHex?: string
  gAddress?: string
}

export interface SetupSendRulesResponse extends BuildSendTxResponse {
  alreadyConfigured?: boolean
  message?: string
  configuredAsset?: BuildSendAssetInfo
  remainingSetupCount?: number
  instructions?: string
}

export interface GetSmartAccountBalancesRequest {
  accountId: string
}

export interface GetSmartAccountBalancesResponse {
  rows: SmartAccountBalanceRow[]
  totalBalanceUsd?: string
}

export type SmartAccountTransactionKind = 'sent' | 'received' | 'deposit' | 'swap'
export type SmartAccountTransactionStatus = 'completed' | 'pending'

export interface SmartAccountTransactionRow {
  id: string
  transactionHash: string
  createdAt: string
  direction: 'sent' | 'received'
  assetCode: string
  amount: string
  amountLabel: string
  amountUsd: string | null
  status: SmartAccountTransactionStatus
  kind: SmartAccountTransactionKind
  from: string
  to: string
}

export interface GetSmartAccountTransactionsRequest {
  accountId: string
}

export interface GetSmartAccountTransactionsResponse {
  items: SmartAccountTransactionRow[]
}

export interface GetAssetIconDataUrlsRequest {
  assets: { code: string; issuer?: string; sacContractId?: string }[]
}

export interface GetAssetIconDataUrlsResponse {
  /** Parallel to `assets`; null when unknown or failed. */
  icons: (string | null)[]
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

/** GET /api/smart-account/freighter?gAddress=… — shape may include backend aliases */
export interface FreighterSmartAccountStatusResponse {
  deployed: boolean
  smartAccountAddress: string
}

export interface ImportMnemonicAccountRequest {
  mnemonic: string
  bip39Passphrase?: string
  remember?: boolean
  encryptionPassword?: string
}

export interface ImportMnemonicAccountResponse {
  gAddress: string
  smartAccountAddress: string
  alreadyDeployed: boolean
  account: StoredAccount
}

export interface UnlockMnemonicVaultRequest {
  accountId: string
  encryptionPassword: string
}

export interface SignDelegatedGAuthEntryRequest {
  accountId: string
  /** Unsigned Soroban authorization entry XDR (base64); used with stellar-base `authorizeEntry`. */
  gAddressEntryTemplateXdr: string
  /** Stellar network passphrase (e.g. `Networks.TESTNET`); must match the delegated build. */
  networkPassphrase: string
}

export interface SignDelegatedGAuthEntryResponse {
  signedAuthEntryBase64: string
  signerAddress: string
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

/** SAC transfer intent for smart-account outbound send. */
export interface BuildTransferIntent {
  sacContractId: string
  assetCode: string
  assetIssuer?: string
  destination: string
  /** Human-readable amount (typically 7 dp for SAC). */
  amount: string
  memo?: string
}

export interface BuildTxRequest {
  smartAccountAddress: string
  signerG?: string
  transfer?: BuildTransferIntent
}

export interface BuildTxResponse {
  txXdr: string
  authEntryXdr: string
  authDigestHex: string
  contextRuleId: string
  validUntilLedger: number
  estimatedFeeXlm?: string
  estimatedFeeUsd?: string
  feeLabel?: string
  // allow backend to add more fields without breaking
  [k: string]: unknown
}

export interface BuildDelegatedTxRequest {
  smartAccountAddress: string
  gAddress: string
  transfer?: BuildTransferIntent
}

export interface BuildDelegatedTxResponse {
  txXdr: string
  smartAccountAuthEntryXdr: string
  gAddressPreimageXdr: string
  gAddressEntryTemplateXdr: string
  authDigestHex: string
  estimatedFeeXlm?: string
  estimatedFeeUsd?: string
  feeLabel?: string
}

export interface SubmitPhantomTxRequest {
  txXdr: string
  authEntryXdr: string
  authSignatureHex: string
  prefixedMessage: string
  publicKeyHex: string
  contextRuleId: number | string
}

export interface SubmitDelegatedTxRequest {
  txXdr: string
  smartAccountAuthEntryXdr: string
  gAddressEntryTemplateXdr: string
  /** Base64 of raw 64-byte Ed25519 signature (not full signed auth entry XDR). */
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
  transactionHash?: string
  hash?: string
  status?: string
  // backend response is not specified; accept opaque
  [k: string]: unknown
}

export interface BackendWebauthnBeginResponse {
  options: unknown
}

export interface BackendWebauthnRegistrationFinishRequest {
  response: unknown
}

export interface BackendWebauthnRegistrationFinishResponse {
  credentialId: string
  keyDataHex: string
  smartAccountAddress: string
  deployed: boolean
  alreadyDeployed: boolean
  [k: string]: unknown
}

export interface BackendWebauthnAuthenticationFinishRequest {
  response: unknown
}

export interface BackendSessionAccount {
  smartAccountAddress: string
  credentialId?: string
  deployed?: boolean
  createdAt?: number
  [k: string]: unknown
}

export interface BackendAccountsResponse {
  accounts: BackendSessionAccount[]
}

export interface BackendWebauthnAuthenticationFinishResponse {
  smartAccountAddress: string
  keyDataHex: string
  deployed: boolean
  activeCredentialId?: string
  accounts: BackendSessionAccount[]
  [k: string]: unknown
}

export type DappPermission = 'getPublicKey' | 'signTransaction'

export type PendingDappRequestKind = DappPermission | 'externalSignReview'

export interface PendingDappRequest {
  id: string
  origin: string
  kind: PendingDappRequestKind
  createdAt: number
  signRequest?: import('./externalSign').ExternalSignRequest
  prepared?: import('./externalSign').PrepareSignResponse
  source?: import('./externalSign').ExternalSignSource
}

export type ListPendingDappRequestsRequest = Record<string, never>

export interface ListPendingDappRequestsResponse {
  requests: PendingDappRequest[]
}

export interface ResolvePendingDappRequest {
  requestId: string
  approved: boolean
  signedXdr?: string
  txHash?: string
  signedAuthEntry?: string
  signedTxXdr?: string
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
  origin?: string
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

/** G → smart account (C) asset migration — discovery only; sweep uses separate messages. */
export type MigrationDiscoveryState = 'not_needed' | 'not_started' | 'complete' | 'unsupported'

export type MigrableAssetKind = 'native' | 'token'

export interface MigrableAsset {
  kind: MigrableAssetKind
  code: string
  issuer?: string
  /** Human-readable amount for display / sweep input */
  amount: string
  /** Stellar Asset Contract contract id for this asset */
  sacContractId: string
}

export interface MigrationDiscovery {
  state: MigrationDiscoveryState
  gAddress: string
  cAddress: string
  assets: MigrableAsset[]
  /** When state is `unsupported` */
  unsupportedReason?: 'not_mnemonic' | 'missing_addresses'
}

export interface MigrationDiscoverRequest {
  accountId: string
}

export interface MigrationSweepResult {
  success: boolean
  txHash?: string
  ledger?: number
  error?: SerializableError
}

export interface MigrationSweepXlmRequest {
  accountId: string
  /**
   * How many SAC token sweeps will run after this XLM sweep (migration UI passes this).
   * Used to reserve XLM on G for their Soroban fees plus a minimum linger balance.
   */
  pendingTokenSweepCount?: number
}

export interface MigrationSweepTokenRequest {
  accountId: string
  sacContractId: string
}

export interface GetMarketPricesRequest {
  tokens: string[]
}

export type MarketTokenPrice = {
  priceUsd: number
  change24h: number
}

export interface GetMarketPricesResponse {
  updatedAtMs: number | null
  pricesByCodeUpper: Record<string, MarketTokenPrice>
}

// Message types for popup/content ↔ background communication
export type MessageType =
  | 'SIGN_TRANSACTION'
  | 'GET_PUBLIC_KEY'
  | 'UNLOCK_VAULT'
  | 'LOCK_VAULT'
  | 'LOGOUT'
  | 'GET_SETUP_STATE'
  | 'SET_SETUP_STATE'
  | 'GET_ACCOUNTS'
  | 'SET_ACTIVE_ACCOUNT'
  | 'CREATE_OR_CONNECT_FREIGHTER'
  | 'CREATE_OR_CONNECT_PHANTOM'
  | 'CREATE_OR_CONNECT_PASSKEY'
  | 'IMPORT_MNEMONIC_ACCOUNT'
  | 'UNLOCK_MNEMONIC_VAULT'
  | 'SIGN_DELEGATED_G_AUTH_ENTRY'
  | 'BUILD_TX'
  | 'BUILD_DELEGATED_TX'
  | 'SUBMIT_TX_PHANTOM'
  | 'SUBMIT_TX_DELEGATED'
  | 'SUBMIT_TX_WEBAUTHN'
  | 'PASSKEY_REG_BEGIN'
  | 'PASSKEY_REG_FINISH'
  | 'PASSKEY_AUTH_BEGIN'
  | 'PASSKEY_AUTH_FINISH'
  | 'GET_BACKEND_ACCOUNTS'
  | 'RENAME_ACCOUNT'
  | 'GET_DAPP_PERMISSIONS'
  | 'SET_DAPP_PERMISSIONS'
  | 'LIST_PENDING_DAPP_REQUESTS'
  | 'RESOLVE_PENDING_DAPP_REQUEST'
  | 'DAPP_GET_PUBLIC_KEY'
  | 'DAPP_SIGN_TRANSACTION'
  | 'DAPP_OPEN_SIGN_REQUEST'
  | 'MIGRATION_DISCOVER'
  | 'MIGRATION_SWEEP_XLM'
  | 'MIGRATION_SWEEP_TOKEN'
  | 'GET_SMART_ACCOUNT_BALANCES'
  | 'GET_SMART_ACCOUNT_TRANSACTIONS'
  | 'GET_MARKET_PRICES'
  | 'GET_ASSET_ICON_DATA_URLS'
  | 'BUILD_SEND_TX'
  | 'SETUP_SEND_RULES'
  | 'OPEN_WALLET_AFTER_ONBOARDING'
  | 'PREPARE_EXTERNAL_SIGN'
  | 'RUN_EXTERNAL_SIGN_FLOW'
  | 'GET_ACTIVE_NETWORK'
  | 'PING_EXTENSION'

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
  LOGOUT: undefined
  GET_SETUP_STATE: undefined
  SET_SETUP_STATE: SetSetupStateRequest
  GET_ACCOUNTS: undefined
  SET_ACTIVE_ACCOUNT: SetActiveAccountRequest
  CREATE_OR_CONNECT_FREIGHTER: CreateOrConnectFreighterRequest
  CREATE_OR_CONNECT_PHANTOM: CreateOrConnectPhantomRequest
  CREATE_OR_CONNECT_PASSKEY: CreateOrConnectPasskeyRequest
  IMPORT_MNEMONIC_ACCOUNT: ImportMnemonicAccountRequest
  UNLOCK_MNEMONIC_VAULT: UnlockMnemonicVaultRequest
  SIGN_DELEGATED_G_AUTH_ENTRY: SignDelegatedGAuthEntryRequest
  BUILD_TX: BuildTxRequest
  BUILD_DELEGATED_TX: BuildDelegatedTxRequest
  SUBMIT_TX_PHANTOM: SubmitPhantomTxRequest
  SUBMIT_TX_DELEGATED: SubmitDelegatedTxRequest
  SUBMIT_TX_WEBAUTHN: SubmitWebauthnTxRequest
  PASSKEY_REG_BEGIN: { displayName?: string } | undefined
  PASSKEY_REG_FINISH: BackendWebauthnRegistrationFinishRequest
  PASSKEY_AUTH_BEGIN: undefined
  PASSKEY_AUTH_FINISH: BackendWebauthnAuthenticationFinishRequest
  GET_BACKEND_ACCOUNTS: undefined
  RENAME_ACCOUNT: { accountId: string; label?: string }
  GET_DAPP_PERMISSIONS: GetDappPermissionsRequest
  SET_DAPP_PERMISSIONS: SetDappPermissionsRequest
  LIST_PENDING_DAPP_REQUESTS: ListPendingDappRequestsRequest
  RESOLVE_PENDING_DAPP_REQUEST: ResolvePendingDappRequest
  DAPP_GET_PUBLIC_KEY: GetDappPermissionsRequest
  DAPP_SIGN_TRANSACTION: DappSignTransactionRequest
  DAPP_OPEN_SIGN_REQUEST: import('./externalSign').DappOpenSignRequestPayload
  MIGRATION_DISCOVER: MigrationDiscoverRequest
  MIGRATION_SWEEP_XLM: MigrationSweepXlmRequest
  MIGRATION_SWEEP_TOKEN: MigrationSweepTokenRequest
  GET_SMART_ACCOUNT_BALANCES: GetSmartAccountBalancesRequest
  GET_SMART_ACCOUNT_TRANSACTIONS: GetSmartAccountTransactionsRequest
  GET_MARKET_PRICES: GetMarketPricesRequest
  GET_ASSET_ICON_DATA_URLS: GetAssetIconDataUrlsRequest
  BUILD_SEND_TX: BuildSendTxRequest
  SETUP_SEND_RULES: SetupSendRulesRequest
  OPEN_WALLET_AFTER_ONBOARDING: undefined
  PREPARE_EXTERNAL_SIGN: import('./externalSign').RunExternalSignFlowRequest
  RUN_EXTERNAL_SIGN_FLOW: import('./externalSign').RunExternalSignFlowRequest
  GET_ACTIVE_NETWORK: undefined
  PING_EXTENSION: undefined
} & Record<string, unknown>

export type BackgroundResponseDataByType = {
  LOGOUT: undefined
  GET_SETUP_STATE: GetSetupStateResponse
  SET_SETUP_STATE: undefined
  GET_ACCOUNTS: GetAccountsResponse
  SET_ACTIVE_ACCOUNT: undefined
  CREATE_OR_CONNECT_FREIGHTER: CreateOrConnectFreighterResponse & { account: StoredAccount }
  CREATE_OR_CONNECT_PHANTOM: CreateOrConnectPhantomResponse & { account: StoredAccount }
  CREATE_OR_CONNECT_PASSKEY: CreateOrConnectPasskeyResponse & { account: StoredAccount }
  IMPORT_MNEMONIC_ACCOUNT: ImportMnemonicAccountResponse
  UNLOCK_MNEMONIC_VAULT: undefined
  SIGN_DELEGATED_G_AUTH_ENTRY: SignDelegatedGAuthEntryResponse
  BUILD_TX: BuildTxResponse
  BUILD_DELEGATED_TX: BuildDelegatedTxResponse
  SUBMIT_TX_PHANTOM: SubmitTxResponse
  SUBMIT_TX_DELEGATED: SubmitTxResponse
  SUBMIT_TX_WEBAUTHN: SubmitTxResponse
  PASSKEY_REG_BEGIN: BackendWebauthnBeginResponse
  PASSKEY_REG_FINISH: BackendWebauthnRegistrationFinishResponse & { account: StoredAccount }
  PASSKEY_AUTH_BEGIN: BackendWebauthnBeginResponse
  PASSKEY_AUTH_FINISH: BackendWebauthnAuthenticationFinishResponse & {
    account: StoredAccount
    accounts: StoredAccount[]
    activeAccountId?: string
  }
  GET_BACKEND_ACCOUNTS: BackendAccountsResponse
  RENAME_ACCOUNT: undefined
  GET_DAPP_PERMISSIONS: GetDappPermissionsResponse
  SET_DAPP_PERMISSIONS: GetDappPermissionsResponse
  LIST_PENDING_DAPP_REQUESTS: ListPendingDappRequestsResponse
  RESOLVE_PENDING_DAPP_REQUEST: undefined
  DAPP_GET_PUBLIC_KEY: DappGetPublicKeyResponse
  DAPP_SIGN_TRANSACTION: DappSignTransactionResponse
  DAPP_OPEN_SIGN_REQUEST: undefined
  MIGRATION_DISCOVER: MigrationDiscovery
  MIGRATION_SWEEP_XLM: MigrationSweepResult
  MIGRATION_SWEEP_TOKEN: MigrationSweepResult
  GET_SMART_ACCOUNT_BALANCES: GetSmartAccountBalancesResponse
  GET_SMART_ACCOUNT_TRANSACTIONS: GetSmartAccountTransactionsResponse
  GET_MARKET_PRICES: GetMarketPricesResponse
  GET_ASSET_ICON_DATA_URLS: GetAssetIconDataUrlsResponse
  BUILD_SEND_TX: BuildSendTxResponse
  SETUP_SEND_RULES: SetupSendRulesResponse
  OPEN_WALLET_AFTER_ONBOARDING: undefined
  PREPARE_EXTERNAL_SIGN: import('./externalSign').RunExternalSignFlowPreparedResponse
  RUN_EXTERNAL_SIGN_FLOW: import('./externalSign').ExternalSignResult
  GET_ACTIVE_NETWORK: { network: Network }
  PING_EXTENSION: { connected: true }
} & Record<string, unknown>

export * from './externalSign'
