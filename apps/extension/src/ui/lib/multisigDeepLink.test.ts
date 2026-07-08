import { describe, expect, it, vi } from 'vitest'

import {
  COSIGN_JOIN_TAB_PAGE,
  buildCosignInviteUrl,
  parseCosignJoinTokenFromLocation,
  parseInviteTokenFromInput,
} from './cosignDeepLink'

describe('cosignDeepLink', () => {
  it('buildCosignInviteUrl points at the join tab page', () => {
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: (path: string) => `chrome-extension://test/${path}`,
      },
    })
    const url = buildCosignInviteUrl('abc123')
    expect(url).toBe(`chrome-extension://test/${COSIGN_JOIN_TAB_PAGE}?multisigJoin=abc123`)
  })

  it('parseCosignJoinTokenFromLocation reads cosignJoin and legacy multisigJoin', () => {
    vi.stubGlobal('window', {
      location: { search: '?cosignJoin=token%2Fvalue' },
    })
    expect(parseCosignJoinTokenFromLocation()).toBe('token/value')

    vi.stubGlobal('window', {
      location: { search: '?multisigJoin=legacy' },
    })
    expect(parseCosignJoinTokenFromLocation()).toBe('legacy')
  })

  it('parseInviteTokenFromInput accepts raw token, query string, and invite URLs', () => {
    expect(parseInviteTokenFromInput('abc-123-token')).toBe('abc-123-token')
    expect(parseInviteTokenFromInput('?cosignJoin=token%2Fvalue')).toBe('token/value')
    expect(
      parseInviteTokenFromInput(
        'chrome-extension://test/tabs/multisig-join.html?cosignJoin=uuid-here'
      )
    ).toBe('uuid-here')
    expect(parseInviteTokenFromInput('cosignJoin=legacy-token')).toBe('legacy-token')
  })
})
