import { describe, expect, it } from 'vitest'

import { base64UrlToStandardB64, buildWalletSignInBodyFromAssertion } from './v1WalletSignIn'

describe('base64UrlToStandardB64', () => {
  it('converts base64url to standard base64 with padding', () => {
    expect(base64UrlToStandardB64('AQ')).toBe('AQ==')
    expect(base64UrlToStandardB64('AQI')).toBe('AQI=')
    expect(base64UrlToStandardB64('AQID')).toBe('AQID')
    expect(base64UrlToStandardB64('ab-9_0')).toBe('ab+9/0==')
  })
})

describe('buildWalletSignInBodyFromAssertion', () => {
  const assertion = {
    id: 'cred',
    rawId: 'cred',
    type: 'public-key',
    response: {
      clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0In0',
      authenticatorData: 'hOmxh8GE_HL9YIJ5bzMlrA',
      signature: 'MEUCIQDtest_sig',
    },
  }

  it('builds sign-in body with standard base64 fields', () => {
    const body = buildWalletSignInBodyFromAssertion({
      wallet: ' CABC ',
      keyType: 'passkey',
      nonce: ' nonce1 ',
      assertion,
    })
    expect(body).toMatchObject({
      wallet: 'CABC',
      key_type: 'passkey',
      nonce: 'nonce1',
      client_data_json: base64UrlToStandardB64('eyJ0eXBlIjoid2ViYXV0aG4uZ2V0In0'),
      authenticator_data: base64UrlToStandardB64('hOmxh8GE_HL9YIJ5bzMlrA'),
      passkey_signature: base64UrlToStandardB64('MEUCIQDtest_sig'),
    })
    expect(body.key_data_hex).toBeUndefined()
  })

  it('includes key_data_hex only when non-empty', () => {
    const withHex = buildWalletSignInBodyFromAssertion({
      wallet: 'CABC',
      keyType: 'passkey',
      nonce: 'n',
      assertion,
      keyDataHex: ' 0444ab ',
    })
    expect(withHex.key_data_hex).toBe('0444ab')

    const blank = buildWalletSignInBodyFromAssertion({
      wallet: 'CABC',
      keyType: 'passkey',
      nonce: 'n',
      assertion,
      keyDataHex: '   ',
    })
    expect(blank.key_data_hex).toBeUndefined()
  })

  it('rejects assertions missing WebAuthn response fields', () => {
    expect(() =>
      buildWalletSignInBodyFromAssertion({
        wallet: 'CABC',
        keyType: 'passkey',
        nonce: 'n',
        assertion: {
          id: 'cred',
          rawId: 'cred',
          type: 'public-key',
          response: { clientDataJSON: 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0In0' },
        },
      })
    ).toThrow(/missing WebAuthn response fields/)
  })
})
