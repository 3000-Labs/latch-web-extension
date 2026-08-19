import { describe, expect, it } from 'vitest'

import { normalizeMultisigSignerInitForApi, normalizeMultisigSignersForApi } from './multisigSignerInit'

describe('multisigSignerInit', () => {
  it('maps passkey UI type to webauthn for accounts predict/deploy', () => {
    expect(
      normalizeMultisigSignerInitForApi({
        type: 'passkey',
        label: 'Trading',
        keyDataHex: '04abcd',
      })
    ).toEqual({
      type: 'webauthn',
      label: 'Trading',
      keyDataHex: '04abcd',
    })
  })

  it('maps seed UI type to delegated', () => {
    expect(
      normalizeMultisigSignerInitForApi({
        type: 'seed',
        label: 'Lee',
        gAddress: 'GABC',
      })
    ).toEqual({
      type: 'delegated',
      label: 'Lee',
      gAddress: 'GABC',
    })
  })

  it('infers webauthn from keyDataHex when type is missing', () => {
    expect(
      normalizeMultisigSignerInitForApi({
        type: '',
        keyDataHex: '04abcd',
      })
    ).toEqual({
      type: 'webauthn',
      keyDataHex: '04abcd',
    })
  })

  it('normalizes signer arrays', () => {
    expect(
      normalizeMultisigSignersForApi([
        { type: 'passkey', keyDataHex: '04aa' },
        { type: 'delegated', gAddress: 'GXYZ' },
      ])
    ).toEqual([
      { type: 'webauthn', keyDataHex: '04aa' },
      { type: 'delegated', gAddress: 'GXYZ' },
    ])
  })
})
