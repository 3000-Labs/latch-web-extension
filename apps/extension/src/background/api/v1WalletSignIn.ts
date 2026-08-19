import { normalizeWebauthnCredentialForApi } from './webauthnCredential'

/** Standard base64 (padding included) from a base64url WebAuthn field. */
export function base64UrlToStandardB64(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const mod = padded.length % 4
  return mod ? padded + '='.repeat(4 - mod) : padded
}

/** Build `/v1/auth/sign-in` passkey body from a browser WebAuthn assertion. */
export function buildWalletSignInBodyFromAssertion(args: {
  wallet: string
  keyType: string
  nonce: string
  assertion: unknown
  keyDataHex?: string
}): Record<string, unknown> {
  const normalized = normalizeWebauthnCredentialForApi(args.assertion, 'authentication')
  const inner = normalized.response as Record<string, string>
  if (!inner.clientDataJSON || !inner.authenticatorData || !inner.signature) {
    throw new Error('Passkey assertion missing WebAuthn response fields')
  }

  const body: Record<string, unknown> = {
    wallet: args.wallet.trim(),
    key_type: args.keyType,
    nonce: args.nonce.trim(),
    client_data_json: base64UrlToStandardB64(inner.clientDataJSON),
    authenticator_data: base64UrlToStandardB64(inner.authenticatorData),
    passkey_signature: base64UrlToStandardB64(inner.signature),
  }

  const keyDataHex = args.keyDataHex?.trim()
  if (keyDataHex) body.key_data_hex = keyDataHex

  return body
}
