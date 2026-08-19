import { describe, expect, it, vi, afterEach } from 'vitest'

describe('webauthnVerifierAddressFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns undefined on mainnet when only the testnet verifier env is set', async () => {
    vi.stubEnv(
      'PLASMO_PUBLIC_WEBAUTHN_VERIFIER_ADDRESS',
      'CDBBGLSWWHWK52REY7GK5HWAQGAJJ4GP5O75LOM3F4INN6W4KT6DPBVY'
    )
    vi.stubEnv('PLASMO_PUBLIC_WEBAUTHN_VERIFIER_ADDRESS_MAINNET', '')
    const { webauthnVerifierAddressFromEnv } = await import('./latchEnv')
    expect(webauthnVerifierAddressFromEnv('mainnet')).toBeUndefined()
  })

  it('returns the mainnet verifier when configured', async () => {
    vi.stubEnv('PLASMO_PUBLIC_WEBAUTHN_VERIFIER_ADDRESS_MAINNET', 'CMAINNETVERIFIER')
    const { webauthnVerifierAddressFromEnv } = await import('./latchEnv')
    expect(webauthnVerifierAddressFromEnv('mainnet')).toBe('CMAINNETVERIFIER')
  })

  it('returns the shared verifier on testnet', async () => {
    vi.stubEnv('PLASMO_PUBLIC_WEBAUTHN_VERIFIER_ADDRESS', 'CTESTVERIFIER')
    const { webauthnVerifierAddressFromEnv } = await import('./latchEnv')
    expect(webauthnVerifierAddressFromEnv('testnet')).toBe('CTESTVERIFIER')
  })
})
