import { describe, expect, it } from 'vitest'
import { DEFAULT_WEBAUTHN_RP_ID, latchWebauthnRpId, normalizeWebauthnRpId } from './latchEnv'

describe('latchEnv webauthn RP ID', () => {
  it('normalizeWebauthnRpId strips protocol and path', () => {
    expect(normalizeWebauthnRpId('latch-testing.vercel.app')).toBe('latch-testing.vercel.app')
    expect(normalizeWebauthnRpId('https://latch-testing.vercel.app/')).toBe(
      'latch-testing.vercel.app'
    )
    expect(normalizeWebauthnRpId('https://Latch-Testing.Vercel.App/foo')).toBe(
      'latch-testing.vercel.app'
    )
  })

  it('latchWebauthnRpId defaults to latch-testing.vercel.app', () => {
    expect(DEFAULT_WEBAUTHN_RP_ID).toBe('latch-testing.vercel.app')
    expect(latchWebauthnRpId()).toBe('latch-testing.vercel.app')
  })
})
