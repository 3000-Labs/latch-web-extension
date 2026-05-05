import { describe, expect, it } from "vitest"
import { Encoder } from "cbor-x"
import { bytesToBase64Url, bytesToHex, concatBytes } from "./utils"
import { extractRegistrationKeyData } from "./passkey"

describe("webauthn/passkey", () => {
  it("extractRegistrationKeyData builds keyDataHex = uncompressedPk||credentialIdBytes", () => {
    const encoder = new Encoder()

    const credIdBytes = new Uint8Array([1, 2, 3, 4, 5])
    const x = new Uint8Array(32).fill(0x11)
    const y = new Uint8Array(32).fill(0x22)

    const coseKeyBytes = encoder.encode({ [-2]: x, [-3]: y })

    // rpIdHash(32) || flags(1) || signCount(4) || AAGUID(16) || credIdLen(2) || credId || coseKey
    const flags = 0x40
    const rpIdHash = new Uint8Array(32)
    const signCount = new Uint8Array(4)
    const aaguid = new Uint8Array(16)
    const credIdLen = new Uint8Array([0, credIdBytes.length])

    const authData = concatBytes(
      rpIdHash,
      concatBytes(
        new Uint8Array([flags]),
        concatBytes(signCount, concatBytes(aaguid, concatBytes(credIdLen, concatBytes(credIdBytes, coseKeyBytes))))
      )
    )

    const attestationObjectBytes = encoder.encode({ authData })
    const registrationResponse = {
      id: "cred-1",
      response: { attestationObject: bytesToBase64Url(attestationObjectBytes) }
    }

    const res = extractRegistrationKeyData(registrationResponse)
    expect(res.credentialId).toBe("cred-1")
    expect(res.credentialIdBytes).toEqual(credIdBytes)
    expect(res.publicKeyUncompressed).toHaveLength(65)
    expect(res.publicKeyUncompressed[0]).toBe(0x04)

    const expectedKeyDataBytes = concatBytes(res.publicKeyUncompressed, credIdBytes)
    expect(res.keyDataHex).toBe(bytesToHex(expectedKeyDataBytes))
  })
})

