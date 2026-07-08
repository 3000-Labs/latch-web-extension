/** User-facing copy for multisig invite / join failures. */
export function formatMultisigInviteError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('expired') ||
    lower.includes('invalid token') ||
    lower.includes('not found') ||
    lower.includes('unknown token')
  ) {
    return 'This invite link has expired or is no longer valid. Ask the wallet creator for a new link.'
  }
  return message
}

/** User-facing copy when proposal simulation or approvals are stale. */
export function formatMultisigProposalError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('stale') ||
    lower.includes('simulation') ||
    lower.includes('ledger') ||
    lower.includes('expired') ||
    lower.includes('sequence')
  ) {
    return 'This proposal may be out of date. Tap Refresh simulation, then approve again.'
  }
  return message
}
