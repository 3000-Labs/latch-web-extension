import { describe, expect, it } from 'vitest'

import {
  buildSep0043NetworkResponse,
  buildSepSignRequest,
  latchCodeToSep0043,
  MAINNET_PASSPHRASE,
  mapNativeSignResponseToSep,
  networkToPassphrase,
  networkToSep0043Name,
  passphraseToNetwork,
  Sep0043ProviderError,
  TESTNET_PASSPHRASE,
  toSep0043Error,
  validateSepSignOptions,
} from './sep0043'

describe('passphraseToNetwork', () => {
  it('returns undefined for missing passphrase', () => {
    expect(passphraseToNetwork(undefined)).toBeUndefined()
    expect(passphraseToNetwork('')).toBeUndefined()
    expect(passphraseToNetwork('  ')).toBeUndefined()
  })

  it('maps canonical passphrases', () => {
    expect(passphraseToNetwork(TESTNET_PASSPHRASE)).toBe('testnet')
    expect(passphraseToNetwork(MAINNET_PASSPHRASE)).toBe('mainnet')
  })

  it('throws -3 for unknown passphrase', () => {
    expect(() => passphraseToNetwork('Unknown Network')).toThrow(Sep0043ProviderError)
    try {
      passphraseToNetwork('Unknown Network')
    } catch (err) {
      expect(err).toBeInstanceOf(Sep0043ProviderError)
      expect((err as Sep0043ProviderError).code).toBe(-3)
    }
  })
})

describe('network helpers', () => {
  it('maps network to passphrase and SEP name', () => {
    expect(networkToPassphrase('testnet')).toBe(TESTNET_PASSPHRASE)
    expect(networkToPassphrase('mainnet')).toBe(MAINNET_PASSPHRASE)
    expect(networkToSep0043Name('testnet')).toBe('TESTNET')
    expect(networkToSep0043Name('mainnet')).toBe('PUBLIC')
  })

  it('builds SEP network response', () => {
    expect(buildSep0043NetworkResponse('testnet')).toEqual({
      network: 'TESTNET',
      networkPassphrase: TESTNET_PASSPHRASE,
    })
    expect(buildSep0043NetworkResponse('mainnet')).toEqual({
      network: 'PUBLIC',
      networkPassphrase: MAINNET_PASSPHRASE,
    })
  })
})

describe('validateSepSignOptions', () => {
  it('allows sign-only defaults', () => {
    expect(() => validateSepSignOptions(undefined)).not.toThrow()
    expect(() => validateSepSignOptions({ submit: false })).not.toThrow()
  })

  it('rejects submit: true', () => {
    expect(() => validateSepSignOptions({ submit: true })).toThrow(Sep0043ProviderError)
    try {
      validateSepSignOptions({ submit: true })
    } catch (err) {
      expect((err as Sep0043ProviderError).code).toBe(-3)
    }
  })

  it('rejects submitUrl', () => {
    expect(() => validateSepSignOptions({ submitUrl: 'https://horizon.test' })).toThrow(
      Sep0043ProviderError
    )
  })
})

describe('buildSepSignRequest', () => {
  const active = 'CACTIVE123'

  it('uses active address when opts.address omitted', () => {
    const req = buildSepSignRequest({
      xdr: 'AAAA',
      activeAddress: active,
      network: 'testnet',
    })
    expect(req).toEqual({
      xdr: 'AAAA',
      network: 'testnet',
      accountToSign: active,
      submit: false,
    })
  })

  it('uses opts.address when provided', () => {
    const req = buildSepSignRequest({
      xdr: 'AAAA',
      opts: { address: 'CHINT456' },
      activeAddress: active,
      network: 'mainnet',
    })
    expect(req.accountToSign).toBe('CHINT456')
    expect(req.network).toBe('mainnet')
    expect(req.submit).toBe(false)
  })
})

describe('mapNativeSignResponseToSep', () => {
  it('returns signedTxXdr and signerAddress', () => {
    expect(mapNativeSignResponseToSep({ signedTxXdr: 'signed-xdr' }, 'CSIGNER')).toEqual({
      signedTxXdr: 'signed-xdr',
      signerAddress: 'CSIGNER',
    })
  })

  it('falls back to deprecated signedXdr', () => {
    expect(mapNativeSignResponseToSep({ signedXdr: 'legacy-xdr' }, 'CSIGNER')).toEqual({
      signedTxXdr: 'legacy-xdr',
      signerAddress: 'CSIGNER',
    })
  })

  it('throws -1 when no signed XDR', () => {
    expect(() => mapNativeSignResponseToSep({ txHash: 'abc123' }, 'CSIGNER')).toThrow(
      Sep0043ProviderError
    )
    try {
      mapNativeSignResponseToSep({ txHash: 'abc123' }, 'CSIGNER')
    } catch (err) {
      expect((err as Sep0043ProviderError).code).toBe(-1)
    }
  })
})

describe('latchCodeToSep0043', () => {
  it('maps user_rejected to -4', () => {
    expect(latchCodeToSep0043('user_rejected', 'User rejected').code).toBe(-4)
  })

  it('maps invalid request codes to -3', () => {
    for (const code of ['account_mismatch', 'validation_error', 'not_connected'] as const) {
      expect(latchCodeToSep0043(code, 'bad').code).toBe(-3)
    }
  })

  it('maps everything else to -1', () => {
    for (const code of ['timeout', 'extension_unreachable', 'no_account', 'error', undefined]) {
      expect(latchCodeToSep0043(code, 'fail').code).toBe(-1)
    }
  })
})

describe('toSep0043Error', () => {
  it('passes through Sep0043ProviderError', () => {
    const err = new Sep0043ProviderError('nope', -3)
    expect(toSep0043Error(err)).toBe(err)
  })

  it('maps LatchProviderError-like errors', () => {
    const err = Object.assign(new Error('User rejected'), { code: 'user_rejected' })
    expect(toSep0043Error(err).code).toBe(-4)
  })
})
