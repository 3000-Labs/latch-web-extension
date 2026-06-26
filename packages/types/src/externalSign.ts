import type { BuildSendTxResponse, Network, SendSignerType } from './index'

export interface PreparedSignOperation {
  type: string
  summary: string
  details?: Record<string, string>
}

export interface PrepareSignRequest {
  network: Network
  smartAccountAddress: string
  unsignedTxXdr: string
  signerType?: SendSignerType
  signerG?: string
}

/** Extends BuildSendTxResponse with review metadata from prepare-sign. */
export interface PrepareSignResponse extends BuildSendTxResponse {
  network: Network
  smartAccountAddress: string
  operations: PreparedSignOperation[]
  warnings?: string[]
}

export interface ExternalSignRequest {
  network: Network
  smartAccountAddress: string
  unsignedTxXdr?: string
  payloadRef?: string
  callback?: string
  requestId?: string
  submit?: boolean
  origin?: string
}

export type ExternalSignSource = 'provider' | 'sign-request-tab'

export type ExternalSignStatus = 'signed' | 'rejected' | 'error'

export interface ExternalSignResult {
  status: ExternalSignStatus
  txHash?: string
  signedAuthEntry?: string
  signedTxXdr?: string
  code?: string
  message?: string
  requestId?: string
  network?: Network
}

export interface SignCallbackResult {
  requestId?: string
  status: ExternalSignStatus
  txHash?: string
  network?: Network
  code?: string
  message?: string
}

export interface SignPayloadStoreResponse {
  network: Network
  smartAccountAddress: string
  unsignedTxXdr: string
  callback: string
  requestId?: string
  origin?: string
  submit?: boolean
}

export interface RunExternalSignFlowRequest {
  source: ExternalSignSource
  request: ExternalSignRequest
}

export interface RunExternalSignFlowPreparedResponse {
  requestId: string
  origin: string
  signRequest: ExternalSignRequest
  prepared: PrepareSignResponse
}

/** Params for window.latch.openSignRequest (Layer 2 without chrome-extension:// redirect). */
export interface OpenSignRequestParams {
  network: Network
  /** Smart account C-address */
  account: string
  callback: string
  requestId: string
  /** Standard base64 unsigned tx XDR */
  xdr?: string
  payloadRef?: string
  submit?: boolean
  origin?: string
}

export interface DappOpenSignRequestPayload {
  origin: string
  request: ExternalSignRequest
}

export enum LATCH_EXTERNAL_SERVICE_TYPES {
  REQUEST_CONNECTION_STATUS = 'REQUEST_CONNECTION_STATUS',
  REQUEST_ACCESS = 'REQUEST_ACCESS',
  REQUEST_PUBLIC_KEY = 'REQUEST_PUBLIC_KEY',
  REQUEST_NETWORK = 'REQUEST_NETWORK',
  SUBMIT_TRANSACTION = 'SUBMIT_TRANSACTION',
}
