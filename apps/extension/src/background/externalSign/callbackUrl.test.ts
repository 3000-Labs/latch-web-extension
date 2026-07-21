import { describe, expect, it } from 'vitest'

import { buildCallbackUrl, externalResultToCallback, isAllowedCallbackUrl } from './callbackUrl'

describe('callbackUrl', () => {
  it('allows https and localhost http', () => {
    expect(isAllowedCallbackUrl('https://dapp.example/cb')).toBe(true)
    expect(isAllowedCallbackUrl('http://localhost:3000/cb')).toBe(true)
    expect(isAllowedCallbackUrl('javascript:alert(1)')).toBe(false)
  })

  it('builds success callback', () => {
    const url = buildCallbackUrl('https://example.com/cb', {
      status: 'signed',
      requestId: 'r1',
      txHash: 'hash123',
      network: 'testnet',
    })
    expect(url).toContain('status=signed')
    expect(url).toContain('txHash=hash123')
    expect(url).toContain('requestId=r1')
    expect(url).toContain('network=testnet')
  })

  it('appends signedAuthEntry fragment when submit=false', () => {
    const url = externalResultToCallback(
      'https://example.com/cb',
      {
        status: 'signed',
        signedAuthEntry: 'authB64',
        network: 'testnet',
      },
      false
    )
    expect(url).toContain('#signedAuthEntry=')
    expect(url).toContain(encodeURIComponent('authB64'))
  })

  it('appends both signedAuthEntry and signedTxXdr fragments when submit=false', () => {
    const url = externalResultToCallback(
      'https://example.com/cb',
      {
        status: 'signed',
        signedAuthEntry: 'authB64',
        signedTxXdr: 'AAAA/tx==',
        network: 'testnet',
      },
      false
    )
    const [, fragment] = url.split('#')
    expect(fragment).toContain(`signedAuthEntry=${encodeURIComponent('authB64')}`)
    expect(fragment).toContain(`signedTxXdr=${encodeURIComponent('AAAA/tx==')}`)
    expect(fragment).toContain('&')
  })

  it('omits fragment for submit=true even with signedTxXdr present', () => {
    const url = externalResultToCallback(
      'https://example.com/cb',
      {
        status: 'signed',
        signedTxXdr: 'AAAA/tx==',
        txHash: 'hash123',
        network: 'testnet',
      },
      true
    )
    expect(url).not.toContain('#')
    expect(url).toContain('txHash=hash123')
  })

  it('builds rejected callback', () => {
    const url = buildCallbackUrl('http://localhost:3000/cb', {
      status: 'rejected',
      code: 'user_rejected',
      message: 'User rejected',
    })
    expect(url).toContain('status=rejected')
    expect(url).toContain('code=user_rejected')
  })
})
