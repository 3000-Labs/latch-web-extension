import type { StoredAccount } from "@latch/types"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Encoder } from "cbor-x"
import { bytesToBase64Url, bytesToHex, concatBytes } from "./utils"
import {
  assertBeginOptionsRpIdMatchesExtension,
  enrichWebauthnRpIdHashErrorMessage,
  extractRegistrationKeyData,
  formatWebauthnBrowserError,
  getWebauthnRpIdFromBeginOptions,
  nextPasskeyAccountDisplayName,
  readAuthenticatorRpIdHashHexFromCredentialJSON,
  buildWebauthnSigDataXdrHex,
  passkeyAuthenticationOptionsForAuthDigest,
  toLowSCompactSignatureP256
} from "./passkey"
import { base64UrlToBytes, bytesToBase64Url, hexToBytes } from "./utils"

function account(mode: StoredAccount["mode"], id: string): StoredAccount {
  return { id, mode, smartAccountAddress: "SADDR", createdAt: 0 }
}

describe("webauthn/passkey", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("nextPasskeyAccountDisplayName is 1-based and counts only passkey accounts", () => {
    expect(nextPasskeyAccountDisplayName([])).toBe("Latch account 1")
    expect(nextPasskeyAccountDisplayName([account("mnemonic", "1"), account("passkey", "2")])).toBe("Latch account 2")
    expect(nextPasskeyAccountDisplayName([account("passkey", "1"), account("passkey", "2")])).toBe("Latch account 3")
  })

  it("getWebauthnRpIdFromBeginOptions reads rp.id or rpId from object or JSON string", () => {
    expect(getWebauthnRpIdFromBeginOptions({ rp: { id: "ext-1", name: "x" }, challenge: "c" })).toBe("ext-1")
    expect(getWebauthnRpIdFromBeginOptions({ rpId: "ext-2", challenge: "c" })).toBe("ext-2")
    expect(
      getWebauthnRpIdFromBeginOptions(JSON.stringify({ rp: { id: "ext-3", name: "x" }, challenge: "c" }))
    ).toBe("ext-3")
    expect(getWebauthnRpIdFromBeginOptions(null)).toBeUndefined()
  })

  it("assertBeginOptionsRpIdMatchesExtension throws on chrome-extension when rp id mismatches", () => {
    vi.stubGlobal("chrome", { runtime: { id: "expected-ext" } })
    vi.stubGlobal("window", { location: { protocol: "chrome-extension:" } })

    expect(() => assertBeginOptionsRpIdMatchesExtension({ rp: { id: "wrong", name: "n" } })).toThrow(/RP mismatch/)

    expect(() => assertBeginOptionsRpIdMatchesExtension({ rp: { id: "expected-ext", name: "n" } })).not.toThrow()
  })

  it("assertBeginOptionsRpIdMatchesExtension is a no-op when not on chrome-extension protocol", () => {
    vi.stubGlobal("chrome", { runtime: { id: "expected-ext" } })
    vi.stubGlobal("window", { location: { protocol: "https:" } })

    expect(() => assertBeginOptionsRpIdMatchesExtension({ rp: { id: "wrong", name: "n" } })).not.toThrow()
  })

  it("formatWebauthnBrowserError surfaces cause for ERROR_INVALID_DOMAIN on chrome-extension", () => {
    vi.stubGlobal("chrome", { runtime: { id: "ghpalnblflhpeggnlilhhmohbdinlfne" } })
    vi.stubGlobal("window", {
      location: { protocol: "chrome-extension:" },
    })

    const err = new Error("ghpalnblflhpeggnlilhhmohbdinlfne is an invalid domain")
    ;(err as { code?: string }).code = "ERROR_INVALID_DOMAIN"
    err.cause = new Error("SecurityError: The relying party ID is not valid.")

    const msg = formatWebauthnBrowserError(err)
    expect(msg).toContain("Details:")
    expect(msg).toContain('rp.id to "ghpalnblflhpeggnlilhhmohbdinlfne"')
  })

  it("passkeyAuthenticationOptionsForAuthDigest uses auth digest as WebAuthn challenge", () => {
    const digest = "21e5a6e8c3d0940bdd4f01ba07ce73bd5898c8116911d444ed7e4a4b631ee975"
    const opts = passkeyAuthenticationOptionsForAuthDigest({
      credentialId: "cred-id",
      authDigestHex: digest,
      rpId: "ghpalnblflhpeggnlilhhmohbdinlfne"
    })
    expect(opts.rpId).toBe("ghpalnblflhpeggnlilhhmohbdinlfne")
    expect(opts.challenge).toBe(bytesToBase64Url(hexToBytes(digest)))
    expect(base64UrlToBytes(opts.challenge)).toEqual(hexToBytes(digest))
    expect(opts.allowCredentials).toEqual([{ id: "cred-id", type: "public-key" }])
  })

  it("buildWebauthnSigDataXdrHex returns hex XDR", () => {
    const hex = buildWebauthnSigDataXdrHex({
      authenticatorData: new Uint8Array(37),
      clientDataJson: new Uint8Array(20),
      signatureCompact: new Uint8Array(64)
    })
    expect(hex).toMatch(/^[0-9a-f]+$/)
    expect(hex.length).toBeGreaterThan(0)
  })

  it("toLowSCompactSignatureP256 returns 64-byte compact sig (noble/curves v2)", () => {
    const der = new Uint8Array([0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x01])
    const out = toLowSCompactSignatureP256(der)
    expect(out).toHaveLength(64)
    expect(out[31]).toBe(1)
    expect(out[63]).toBe(1)
  })

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

  it("readAuthenticatorRpIdHashHexFromCredentialJSON reads first 32 bytes from authenticatorData", () => {
    const rpIdHash = new Uint8Array(32)
    rpIdHash[0] = 0xab
    rpIdHash[31] = 0xcd
    const authData = concatBytes(rpIdHash, new Uint8Array([0, 0, 0, 0]))
    const cred = { response: { authenticatorData: bytesToBase64Url(authData) } }
    expect(readAuthenticatorRpIdHashHexFromCredentialJSON(cred)).toBe(bytesToHex(rpIdHash))
  })

  it("enrichWebauthnRpIdHashErrorMessage leaves unrelated messages unchanged", async () => {
    expect(await enrichWebauthnRpIdHashErrorMessage("Network error", {})).toBe("Network error")
  })

  it("enrichWebauthnRpIdHashErrorMessage appends expected vs authenticator rpId hashes", async () => {
    const rpId = "test-extension-id"
    const enc = new TextEncoder()
    const expectedDigest = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(rpId)))
    const expectedHex = bytesToHex(expectedDigest)

    const encoder = new Encoder()
    const credIdBytes = new Uint8Array([1])
    const x = new Uint8Array(32).fill(0x11)
    const y = new Uint8Array(32).fill(0x22)
    const coseKeyBytes = encoder.encode({ [-2]: x, [-3]: y })
    const flags = 0x40
    const authRpIdHash = new Uint8Array(32).fill(0xee)
    const signCount = new Uint8Array(4)
    const aaguid = new Uint8Array(16)
    const credIdLen = new Uint8Array([0, credIdBytes.length])
    const authData = concatBytes(
      authRpIdHash,
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

    const msg = await enrichWebauthnRpIdHashErrorMessage("Unexpected RP ID hash", {
      optionsJSON: { rp: { id: rpId, name: "Latch" }, challenge: "x" },
      credentialResponse: registrationResponse
    })

    expect(msg).toContain("Unexpected RP ID hash")
    expect(msg).toContain(`"test-extension-id"`)
    expect(msg).toContain(expectedHex)
    expect(msg).toContain(bytesToHex(authRpIdHash))
  })
})

