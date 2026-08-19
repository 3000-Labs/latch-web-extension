import type { MultisigSignerInitRequest } from '@latch/types'

/**
 * Map extension/UI signer labels to `/api/multisig/accounts/*` factory signer kinds.
 * Draft/join APIs use `passkey` / `seed`; predict + deploy expect `webauthn` / `delegated`.
 */
export function normalizeMultisigSignerInitForApi(
  signer: MultisigSignerInitRequest
): MultisigSignerInitRequest {
  const type = signer.type?.trim().toLowerCase() ?? ''
  const keyDataHex = signer.keyDataHex?.trim()
  const gAddress = signer.gAddress?.trim()

  let apiType = type
  if (apiType === 'passkey') apiType = 'webauthn'
  else if (apiType === 'seed') apiType = 'delegated'
  else if (!apiType && keyDataHex) apiType = 'webauthn'
  else if (!apiType && gAddress) apiType = 'delegated'

  return {
    type: apiType,
    label: signer.label,
    ...(gAddress ? { gAddress } : {}),
    ...(keyDataHex ? { keyDataHex } : {}),
  }
}

export function normalizeMultisigSignersForApi(
  signers: MultisigSignerInitRequest[]
): MultisigSignerInitRequest[] {
  return signers.map(normalizeMultisigSignerInitForApi)
}
