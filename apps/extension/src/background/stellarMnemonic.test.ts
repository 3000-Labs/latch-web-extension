import { describe, expect, it } from "vitest"

import {
  assertValidMnemonicPhrase,
  deriveStellarKeypairFromMnemonic,
  MnemonicValidationError,
  normalizeMnemonicPhrase
} from "./stellarMnemonic"

describe("stellarMnemonic", () => {
  it("normalizes whitespace and case", () => {
    const raw = "  Test TEST\nTest\t test \n test test test test test test test  junk  "
    const n = normalizeMnemonicPhrase(raw)
    expect(n.split(" ")).toHaveLength(12)
    expect(n.startsWith("test ")).toBe(true)
    expect(() => assertValidMnemonicPhrase(n)).not.toThrow()
  })

  it("derives deterministic Stellar G-address for fixed test vector", () => {
    const mnemonic =
      "test test test test test test test test test test test junk"
    const { gAddress } = deriveStellarKeypairFromMnemonic(mnemonic, undefined)
    expect(gAddress).toBe("GCRN5PMAG5FM5QLCH7BUZPRQ7UIW37LBZLF2BIDEOSG4ZQ6HYRC45ALA")
  })

  it("rejects invalid mnemonic checksum", () => {
    const bad = "test test test test test test test test test test test zebra"
    expect(() => deriveStellarKeypairFromMnemonic(bad, undefined)).toThrow(MnemonicValidationError)
  })

  it("rejects wrong word count", () => {
    const six = "test test test test test test"
    expect(() => assertValidMnemonicPhrase(normalizeMnemonicPhrase(six))).toThrow(MnemonicValidationError)
  })
})
