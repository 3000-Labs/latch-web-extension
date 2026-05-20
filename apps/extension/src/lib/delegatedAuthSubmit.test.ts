import { authorizeEntry, Keypair, Networks, xdr } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'

import { normalizeDelegatedSignatureBase64 } from './delegatedAuthSubmit'

async function signedTemplateEntryBase64(): Promise<string> {
  const signer = Keypair.random()
  const template = new xdr.SorobanAuthorizationEntry({
    credentials: xdr.SorobanCredentials.sorobanCredentialsAddress(
      new xdr.SorobanAddressCredentials({
        address: xdr.ScAddress.scAddressTypeAccount(
          xdr.PublicKey.publicKeyTypeEd25519(signer.rawPublicKey())
        ),
        nonce: xdr.Int64.fromString('0'),
        signatureExpirationLedger: 9_999_999,
        signature: xdr.ScVal.scvVec([]),
      })
    ),
    rootInvocation: new xdr.SorobanAuthorizedInvocation({
      function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(
        new xdr.InvokeContractArgs({
          contractAddress: xdr.ScAddress.scAddressTypeContract(Keypair.random().rawPublicKey()),
          functionName: Buffer.from('transfer'),
          args: [],
        })
      ),
      subInvocations: [],
    }),
  })
  const signed = await authorizeEntry(template, signer, 9_999_999, Networks.TESTNET)
  return signed.toXDR('base64')
}

describe('normalizeDelegatedSignatureBase64', () => {
  it('passes through value that is already 64 raw bytes', () => {
    const sig = Buffer.alloc(64, 7)
    const b64 = sig.toString('base64')
    expect(normalizeDelegatedSignatureBase64(b64)).toBe(b64)
  })

  it('extracts 64-byte signature from ScVal-wrapped signed auth entry', async () => {
    const fullXdr = await signedTemplateEntryBase64()
    const normalized = normalizeDelegatedSignatureBase64(fullXdr)
    expect(Buffer.from(normalized, 'base64').length).toBe(64)
    expect(normalized).not.toBe(fullXdr)
  })

  it('coerces serialized Buffer objects from messaging', () => {
    const sig = Buffer.alloc(64, 3)
    const serialized = { type: 'Buffer' as const, data: [...sig] }
    expect(normalizeDelegatedSignatureBase64(serialized)).toBe(sig.toString('base64'))
  })

  it('rejects invalid xdr', () => {
    expect(() => normalizeDelegatedSignatureBase64('not-valid-xdr!!')).toThrow()
  })
})
