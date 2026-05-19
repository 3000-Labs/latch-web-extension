import { authorizeEntry, xdr, type Keypair } from '@stellar/stellar-sdk'

import { normalizeDelegatedSignatureBase64 } from '../lib/delegatedAuthSubmit'

function readSignatureExpirationLedger(entry: xdr.SorobanAuthorizationEntry): number {
  return entry.credentials().address().signatureExpirationLedger()
}

/**
 * Signs the G-address Soroban authorization entry template using a local Ed25519 keypair.
 */
export async function signDelegatedGAddressEntry(args: {
  gAddressEntryTemplateXdr: string
  signer: Keypair
  networkPassphrase: string
}): Promise<{ signedAuthEntryBase64: string; signerAddress: string }> {
  const entry = xdr.SorobanAuthorizationEntry.fromXDR(args.gAddressEntryTemplateXdr, 'base64')
  const validUntil = readSignatureExpirationLedger(entry)
  const signed = await authorizeEntry(entry, args.signer, validUntil, args.networkPassphrase)
  const signedEntryBase64 = signed.toXDR('base64')
  return {
    signedAuthEntryBase64: normalizeDelegatedSignatureBase64(signedEntryBase64),
    signerAddress: args.signer.publicKey(),
  }
}
