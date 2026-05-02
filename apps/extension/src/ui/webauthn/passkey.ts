import { p256 } from "@noble/curves/nist"
import { decodeMultiple } from "cbor-x"
import { xdr } from "@stellar/stellar-sdk"

import { base64UrlToBytes, bytesToBase64Url, bytesToHex, concatBytes, hexToBytes } from "./utils"

export type PasskeyRegistrationResult = {
  credentialId: string
  credentialIdBytes: Uint8Array
  publicKeyUncompressed: Uint8Array // 65 bytes, 0x04 || x || y
  keyDataHex: string
}

export type PasskeyAssertionResult = {
  authenticatorData: Uint8Array
  clientDataJson: Uint8Array
  signatureCompact: Uint8Array // 64 bytes r||s low-S
  sigDataXdrHex: string
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function ensureLen(bytes: Uint8Array, len: number, label: string) {
  if (bytes.length !== len) throw new Error(`${label} must be ${len} bytes`)
}

function decodeFirstCborItem(bytes: Uint8Array): unknown {
  // cbor-x decodeMultiple lets us parse the first item even if there are trailing bytes
  for (const item of decodeMultiple(bytes)) return item
  throw new Error("Failed to decode CBOR")
}

function parseAttestationObject(attestationObjectB64Url: string): {
  authData: Uint8Array
} {
  const bytes = base64UrlToBytes(attestationObjectB64Url)
  const obj = decodeFirstCborItem(bytes) as any
  const authData = obj?.authData
  if (!(authData instanceof Uint8Array)) throw new Error("Invalid attestationObject.authData")
  return { authData }
}

function coseToUncompressedP256(coseKey: any): Uint8Array {
  // COSE_Key fields: -2 => x, -3 => y
  const x = coseKey?.[-2]
  const y = coseKey?.[-3]
  if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array)) throw new Error("Invalid COSE key (missing x/y)")
  ensureLen(x, 32, "P-256 x")
  ensureLen(y, 32, "P-256 y")
  return concatBytes(new Uint8Array([0x04]), concatBytes(x, y))
}

export function extractRegistrationKeyData(registrationResponse: any): PasskeyRegistrationResult {
  const attObj = registrationResponse?.response?.attestationObject
  const credentialId = registrationResponse?.id
  if (typeof attObj !== "string") throw new Error("Missing attestationObject")
  if (typeof credentialId !== "string") throw new Error("Missing credential id")

  const { authData } = parseAttestationObject(attObj)

  // authenticatorData layout:
  // rpIdHash(32) || flags(1) || signCount(4) || attestedCredentialData(if flags&0x40) ...
  const flags = authData[32]
  const hasAttestedCredData = (flags & 0x40) !== 0
  if (!hasAttestedCredData) throw new Error("Attested credential data missing in authenticatorData")

  let offset = 32 + 1 + 4
  offset += 16 // AAGUID
  const credIdLen = readUint16BE(authData, offset)
  offset += 2
  const credentialIdBytes = authData.slice(offset, offset + credIdLen)
  offset += credIdLen

  const coseBytes = authData.slice(offset)
  const coseKey = decodeFirstCborItem(coseBytes)
  const publicKeyUncompressed = coseToUncompressedP256(coseKey)

  const keyDataBytes = concatBytes(publicKeyUncompressed, credentialIdBytes)
  const keyDataHex = bytesToHex(keyDataBytes)

  return { credentialId, credentialIdBytes, publicKeyUncompressed, keyDataHex }
}

function derToRs(der: Uint8Array): { r: bigint; s: bigint } {
  // Minimal ASN.1 DER parser for ECDSA signature: SEQUENCE(INTEGER r, INTEGER s)
  let i = 0
  const expect = (v: number) => {
    if (der[i] !== v) throw new Error("Invalid DER signature")
    i++
  }
  const readLen = () => {
    const b = der[i++]
    if (b < 0x80) return b
    const n = b & 0x7f
    let len = 0
    for (let k = 0; k < n; k++) len = (len << 8) | der[i++]
    return len
  }
  const readInt = (): bigint => {
    expect(0x02)
    const len = readLen()
    const bytes = der.slice(i, i + len)
    i += len
    // remove leading 0x00
    let start = 0
    while (start < bytes.length - 1 && bytes[start] === 0) start++
    let x = 0n
    for (const b of bytes.slice(start)) x = (x << 8n) | BigInt(b)
    return x
  }

  expect(0x30)
  readLen()
  const r = readInt()
  const s = readInt()
  return { r, s }
}

function bigintTo32Bytes(x: bigint): Uint8Array {
  const out = new Uint8Array(32)
  let v = x
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn)
    v >>= 8n
  }
  return out
}

export function toLowSCompactSignatureP256(derSignature: Uint8Array): Uint8Array {
  const { r, s } = derToRs(derSignature)
  const n = p256.CURVE.n
  const lowS = s > n / 2n ? n - s : s
  const rBytes = bigintTo32Bytes(r)
  const sBytes = bigintTo32Bytes(lowS)
  return concatBytes(rBytes, sBytes)
}

export function buildWebauthnSigDataXdrHex(args: {
  authenticatorData: Uint8Array
  clientDataJson: Uint8Array
  signatureCompact: Uint8Array
}): string {
  const entries = [
    ["authenticator_data", args.authenticatorData],
    ["client_data", args.clientDataJson],
    ["signature", args.signatureCompact]
  ].map(([k, v]) =>
    xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol(k),
      val: xdr.ScVal.scvBytes(v as Uint8Array)
    })
  )

  const scVal = xdr.ScVal.scvMap(entries)
  const raw = scVal.toXDR() as unknown as Uint8Array
  return bytesToHex(raw instanceof Uint8Array ? raw : new Uint8Array(raw as any))
}

export function createLocalRegistrationOptions(rpId: string) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const userId = crypto.getRandomValues(new Uint8Array(32))
  return {
    challenge: bytesToBase64Url(challenge),
    rp: { name: "Latch", id: rpId },
    user: {
      id: bytesToBase64Url(userId),
      name: `user@${rpId}`,
      displayName: "Latch user"
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required"
    },
    timeout: 60_000,
    attestation: "none"
  } as const
}

export function createLocalAuthenticationOptions(args: { rpId: string; credentialId: string; authDigestHex: string }) {
  const challenge = hexToBytes(args.authDigestHex)
  return {
    rpId: args.rpId,
    challenge: bytesToBase64Url(challenge),
    allowCredentials: [{ id: args.credentialId, type: "public-key" }],
    timeout: 60_000,
    userVerification: "required"
  } as const
}

export function parseAuthenticationResponse(authResponse: any): Omit<PasskeyAssertionResult, "sigDataXdrHex"> {
  const resp = authResponse?.response
  const authenticatorData = base64UrlToBytes(resp?.authenticatorData)
  const clientDataJson = base64UrlToBytes(resp?.clientDataJSON)
  const signatureDer = base64UrlToBytes(resp?.signature)
  const signatureCompact = toLowSCompactSignatureP256(signatureDer)
  return { authenticatorData, clientDataJson, signatureCompact }
}

