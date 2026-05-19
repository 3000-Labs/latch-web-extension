/** Plasmo inlines `process.env.PLASMO_PUBLIC_*` at build time. */
export function webauthnVerifierAddressFromEnv(): string | undefined {
  const raw = process.env.PLASMO_PUBLIC_WEBAUTHN_VERIFIER_ADDRESS as string | undefined
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
