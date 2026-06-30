export type SwapFeePayerSource = {
  gAddress?: string
}

/** G-address that pays fees and supplies the transaction sequence (not the smart account C-address). */
export function resolveSwapTransactionSourceG(source: SwapFeePayerSource): string {
  const fromAccount = source.gAddress?.trim()
  if (fromAccount?.startsWith('G')) return fromAccount

  const fromEnv = process.env.PLASMO_PUBLIC_LATCH_FEE_PAYER_G?.trim()
  if (fromEnv?.startsWith('G')) return fromEnv

  throw new Error(
    'Swap fee payer G-address is not configured. Set PLASMO_PUBLIC_LATCH_FEE_PAYER_G in apps/extension/.env (Latch API bundler public key) or use an account with a linked G-address.'
  )
}
