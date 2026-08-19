import { describe, expect, it } from 'vitest'

import {
  challengeFromWebauthnCredential,
  normalizeWebauthnCredentialForApi,
} from './webauthnCredential'

describe('api/webauthnCredential', () => {
  it('coerces Buffer-serialized rawId and keeps id/rawId aligned', () => {
    const raw = new Uint8Array([1, 2, 3, 4])
    const normalized = normalizeWebauthnCredentialForApi({
      id: 'abc',
      rawId: { type: 'Buffer', data: [...raw] },
      type: 'public-key',
      response: {
        clientDataJSON: 'Y2Q',
        attestationObject: 'Y28',
      },
    })
    expect(normalized.id).toBe(normalized.rawId)
    expect(typeof normalized.rawId).toBe('string')
    expect((normalized.rawId as string).length).toBeGreaterThan(0)
  })

  it('registration finish omits authenticatorData from inner response', () => {
    const normalized = normalizeWebauthnCredentialForApi(
      {
        id: '7tf1JrslWB4Eym99CnZE5Q',
        rawId: '7tf1JrslWB4Eym99CnZE5Q',
        type: 'public-key',
        response: {
          clientDataJSON: 'Y2Q',
          attestationObject: 'Y28',
          authenticatorData: 'YQ',
        },
      },
      'registration'
    )
    const inner = normalized.response as Record<string, unknown>
    expect(inner.attestationObject).toBe('Y28')
    expect(inner).not.toHaveProperty('authenticatorData')
  })

  it('authentication finish keeps authenticatorData and signature', () => {
    const normalized = normalizeWebauthnCredentialForApi(
      {
        id: '7tf1JrslWB4Eym99CnZE5Q',
        rawId: '7tf1JrslWB4Eym99CnZE5Q',
        type: 'public-key',
        response: {
          clientDataJSON: 'Y2Q',
          authenticatorData: 'YQ',
          signature: 'c2ln',
        },
      },
      'authentication'
    )
    const inner = normalized.response as Record<string, unknown>
    expect(inner.authenticatorData).toBe('YQ')
    expect(inner.signature).toBe('c2ln')
    expect(inner).not.toHaveProperty('attestationObject')
  })

  it('preserves real passkey credential id strings', () => {
    const normalized = normalizeWebauthnCredentialForApi({
      id: '7tf1JrslWB4Eym99CnZE5Q',
      rawId: '7tf1JrslWB4Eym99CnZE5Q',
      type: 'public-key',
      response: {
        clientDataJSON: 'Y2Q',
        authenticatorData: 'YQ',
        signature: 'c2ln',
      },
    })
    expect(normalized.id).toBe('7tf1JrslWB4Eym99CnZE5Q')
    expect(normalized.rawId).toBe('7tf1JrslWB4Eym99CnZE5Q')
  })

  it('preserves string base64url fields without extra browser metadata', () => {
    const normalized = normalizeWebauthnCredentialForApi({
      id: 'cred-id',
      rawId: 'cred-id',
      type: 'public-key',
      clientExtensionResults: {},
      authenticatorAttachment: 'platform',
      response: {
        clientDataJSON: 'Y2Q',
        attestationObject: 'Y28',
      },
    })
    expect(normalized.id).toBe('cred-id')
    expect(normalized.rawId).toBe('cred-id')
    expect(normalized).not.toHaveProperty('clientExtensionResults')
    expect(normalized).not.toHaveProperty('authenticatorAttachment')
  })

  it('challengeFromWebauthnCredential reads challenge from clientDataJSON', () => {
    const clientDataJSON = Buffer.from(
      JSON.stringify({ type: 'webauthn.get', challenge: 'abc-123' })
    ).toString('base64url')
    expect(
      challengeFromWebauthnCredential({
        response: { clientDataJSON, authenticatorData: 'a', signature: 's' },
      })
    ).toBe('abc-123')
  })
})
