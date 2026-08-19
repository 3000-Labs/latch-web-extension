import type { ExternalSignRequest, Network } from '@latch/types'

import { assertAllowedCallbackUrl } from './callbackUrl'

function parseSubmitFlag(raw: string | null): boolean {
  if (raw === null || raw === '') return true
  const v = raw.toLowerCase()
  return v !== 'false' && v !== '0'
}

function parseNetwork(raw: string | null): Network {
  if (raw === 'mainnet') return 'mainnet'
  if (raw === 'testnet') return 'testnet'
  throw new Error('Invalid network: expected testnet or mainnet')
}

export function fromBase64Url(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4 !== 0) b64 += '='
  return b64
}

export function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function buildSignRequestSearchParams(request: ExternalSignRequest): string {
  const params = new URLSearchParams()
  params.set('network', request.network)
  params.set('account', request.smartAccountAddress)
  if (request.unsignedTxXdr) {
    params.set('xdr', toBase64Url(request.unsignedTxXdr))
  }
  if (request.payloadRef) params.set('payloadRef', request.payloadRef)
  if (request.callback) params.set('callback', request.callback)
  if (request.requestId) params.set('requestId', request.requestId)
  if (request.submit !== undefined) params.set('submit', String(request.submit))
  if (request.origin) params.set('origin', request.origin)
  return params.toString()
}

/** Parse sign-request tab query params into ExternalSignRequest. */
export function parseSignRequestFromSearchParams(search: string): ExternalSignRequest {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const network = parseNetwork(params.get('network'))
  const smartAccountAddress = params.get('account')?.trim()
  if (!smartAccountAddress) throw new Error('Missing account parameter')

  const rawXdr = params.get('xdr')?.trim()
  const xdr = rawXdr ? fromBase64Url(rawXdr) : undefined
  const payloadRef = params.get('payloadRef')?.trim()
  if (!xdr && !payloadRef) throw new Error('Either xdr or payloadRef is required')
  if (xdr && payloadRef) throw new Error('Provide only one of xdr or payloadRef')

  const callback = params.get('callback')?.trim()
  if (!callback) throw new Error('Missing callback parameter')
  assertAllowedCallbackUrl(callback)

  const requestId = params.get('requestId')?.trim() || undefined
  const origin = params.get('origin')?.trim() || undefined
  const submit = parseSubmitFlag(params.get('submit'))

  return {
    network,
    smartAccountAddress,
    unsignedTxXdr: xdr,
    payloadRef,
    callback,
    requestId,
    origin,
    submit,
  }
}
