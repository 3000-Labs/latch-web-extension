/**
 * Pure SEP-0043 adapter helpers for the inpage provider.
 * No chrome.* APIs — safe to import from inpage.ts.
 */

import type {
  Network,
  Sep0043ErrorCode,
  Sep0043GetNetworkResponse,
  Sep0043SignTransactionOptions,
  Sep0043SignTransactionResponse,
  SignTransactionRequest,
  SignTransactionResponse,
} from '@latch/types'

export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015'
export const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015'

export class Sep0043ProviderError extends Error {
  code: Sep0043ErrorCode
  ext?: string[]

  constructor(message: string, code: Sep0043ErrorCode, ext?: string[]) {
    super(message)
    this.name = 'Sep0043ProviderError'
    this.code = code
    this.ext = ext
  }
}

export function networkToPassphrase(network: Network): string {
  return network === 'mainnet' ? MAINNET_PASSPHRASE : TESTNET_PASSPHRASE
}

export function networkToSep0043Name(network: Network): 'TESTNET' | 'PUBLIC' {
  return network === 'mainnet' ? 'PUBLIC' : 'TESTNET'
}

export function buildSep0043NetworkResponse(network: Network): Sep0043GetNetworkResponse {
  return {
    network: networkToSep0043Name(network),
    networkPassphrase: networkToPassphrase(network),
  }
}

/**
 * Map a Stellar network passphrase to Latch `Network`.
 * Returns `undefined` when the passphrase is missing (caller should use active network).
 * Throws Sep0043ProviderError (-3) when the passphrase is present but unknown.
 */
export function passphraseToNetwork(passphrase: string | undefined): Network | undefined {
  if (!passphrase?.trim()) return undefined
  const p = passphrase.trim()
  if (p === TESTNET_PASSPHRASE) return 'testnet'
  if (p === MAINNET_PASSPHRASE) return 'mainnet'
  throw new Sep0043ProviderError('Request is invalid. Unknown network passphrase.', -3, [
    'Invalid networkPassphrase',
  ])
}

export function validateSepSignOptions(opts?: Sep0043SignTransactionOptions): void {
  if (opts?.submit === true) {
    throw new Sep0043ProviderError(
      'Request is invalid. SEP sign-only is supported in v1; submit is not supported.',
      -3,
      ['submit: true is not supported in v1']
    )
  }
  if (opts?.submitUrl?.trim()) {
    throw new Sep0043ProviderError(
      'Request is invalid. submitUrl is not supported in Latch v1.',
      -3,
      ['submitUrl is not supported in v1']
    )
  }
}

export function buildSepSignRequest(args: {
  xdr: string
  opts?: Sep0043SignTransactionOptions
  activeAddress: string
  network: Network
}): SignTransactionRequest {
  validateSepSignOptions(args.opts)
  return {
    xdr: args.xdr,
    network: args.network,
    accountToSign: args.opts?.address?.trim() || args.activeAddress,
    submit: false,
  }
}

export function mapNativeSignResponseToSep(
  resp: SignTransactionResponse,
  signerAddress: string
): Sep0043SignTransactionResponse {
  const signedTxXdr = resp.signedTxXdr ?? resp.signedXdr
  if (!signedTxXdr?.trim()) {
    throw new Sep0043ProviderError(
      'The wallet encountered an internal error. Signing completed without signed transaction XDR.',
      -1
    )
  }
  return { signedTxXdr, signerAddress }
}

/**
 * Map a Latch string error code to a SEP-0043 numeric code.
 * Uses an explicit table — no regex on messages.
 */
export function latchCodeToSep0043(code: string | undefined, message: string): Sep0043ProviderError {
  switch (code) {
    case 'user_rejected':
      return new Sep0043ProviderError(message || 'The user rejected this request.', -4)
    case 'account_mismatch':
    case 'validation_error':
    case 'not_connected':
      return new Sep0043ProviderError(message || 'Request is invalid.', -3)
    default:
      return new Sep0043ProviderError(
        message || 'The wallet encountered an internal error.',
        -1
      )
  }
}

export function toSep0043Error(err: unknown): Sep0043ProviderError {
  if (err instanceof Sep0043ProviderError) return err
  if (err instanceof Error) {
    const code = (err as Error & { code?: string | number }).code
    if (typeof code === 'number' && code >= -4 && code <= -1) {
      const ext = (err as Error & { ext?: string[] }).ext
      return new Sep0043ProviderError(err.message, code as Sep0043ErrorCode, ext)
    }
    if (typeof code === 'string') {
      return latchCodeToSep0043(code, err.message)
    }
    return new Sep0043ProviderError(err.message, -1)
  }
  return new Sep0043ProviderError(String(err), -1)
}
