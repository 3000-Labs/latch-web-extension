import { StrKey } from '@stellar/stellar-sdk'

/** Stellar G-account (Ed25519 public key). */
export function isValidStellarGAddress(address: string): boolean {
  const trimmed = address.trim()
  return trimmed.startsWith('G') && StrKey.isValidEd25519PublicKey(trimmed)
}

/** Soroban smart account / contract id (C...). */
export function isValidStellarCAddress(address: string): boolean {
  const trimmed = address.trim()
  if (!trimmed.startsWith('C') || trimmed.length < 56) return false
  try {
    StrKey.decodeContract(trimmed)
    return true
  } catch {
    return false
  }
}

export function isValidStellarRecipient(address: string): boolean {
  const trimmed = address.trim()
  if (!trimmed) return false
  return isValidStellarGAddress(trimmed) || isValidStellarCAddress(trimmed)
}

export function truncateMiddle(addr: string, left = 6, right = 4): string {
  const t = addr.trim()
  if (t.length <= left + right + 3) return t
  return `${t.slice(0, left)}...${t.slice(-right)}`
}

export function tokenDisplayName(code: string): string {
  if (code.toUpperCase() === 'XLM') return 'Stellar'
  return code
}
