import { describe, expect, it } from 'vitest'

import {
  deriveBlindSignerId,
  deriveMemberBlindId,
  derivePickupKey,
  deriveQueueIndex,
  fromHex,
  generateWCK,
  sealWCKBundle,
  toHex,
  unsealWCKBundle,
  generateDeviceTransportKeyPair,
  exportRawPublicKey,
} from './crypto'

describe('cosign crypto', () => {
  it('derives stable blind ids', async () => {
    const wck = generateWCK()
    const signer = new Uint8Array(32).fill(7)
    const wallet = 'CABC123'

    const q1 = await deriveQueueIndex(wck, wallet)
    const q2 = await deriveQueueIndex(wck, wallet)
    expect(q1).toBe(q2)
    expect(q1).toHaveLength(64)

    const blind = await deriveBlindSignerId(wck, signer)
    expect(blind).toHaveLength(64)

    const member = await deriveMemberBlindId(signer)
    expect(member).toHaveLength(64)

    const pickup = await derivePickupKey(wallet)
    expect(pickup).toHaveLength(64)
  })

  it('round-trips WCK bundle seal/unseal', async () => {
    const wck = generateWCK()
    const recipient = await generateDeviceTransportKeyPair()
    const rawPub = await exportRawPublicKey(recipient.publicKey)
    const sealed = await sealWCKBundle(wck, rawPub)
    const opened = await unsealWCKBundle(sealed, recipient.privateKey)
    expect(toHex(opened)).toBe(toHex(wck))
  })

  it('fromHex/toHex round-trip', () => {
    const bytes = new Uint8Array([0, 1, 255])
    expect(fromHex(toHex(bytes))).toEqual(bytes)
  })
})
