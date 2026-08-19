import { describe, expect, it } from 'vitest'

import { extractSidFromFetchResponse } from './webauthnSession'

describe('api/webauthnSession', () => {
  it('extractSidFromFetchResponse reads sid from set-cookie header', () => {
    const res = new Response('{}', {
      headers: {
        'set-cookie': 'sid=abc-123; Path=/; HttpOnly; SameSite=Lax',
      },
    })
    expect(extractSidFromFetchResponse(res)).toBe('abc-123')
  })

  it('extractSidFromFetchResponse returns undefined when sid is missing', () => {
    const res = new Response('{}', { headers: {} })
    expect(extractSidFromFetchResponse(res)).toBeUndefined()
  })
})
