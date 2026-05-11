import { authorizeEntry, xdr, type Keypair } from '@stellar/stellar-sdk'

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
  return {
    signedAuthEntryBase64: signed.toXDR('base64'),
    signerAddress: args.signer.publicKey(),
  }
}
