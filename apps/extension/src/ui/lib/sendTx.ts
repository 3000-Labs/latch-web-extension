import type {
  AccountMode,
  BuildSendTxRequest,
  BuildSendTxResponse,
  SendSignerType,
  SetupSendRulesRequest,
  StoredAccount,
} from '@latch/types'

import { fiatToCrypto } from './sendAmount'
import { webauthnVerifierAddressFromEnv } from './latchEnv'
import type { SendDraft } from '../types/send'

export function sendCryptoAmountFromDraft(draft: SendDraft, priceUsd: number | null): string | null {
  if (!draft.token) return null
  if (draft.inputMode === 'crypto') {
    const trimmed = draft.amount.trim()
    return trimmed || null
  }
  return fiatToCrypto(draft.amount, priceUsd)
}

export function accountToSignerType(mode: AccountMode): SendSignerType {
  if (mode === 'passkey' || mode === 'multisig') return 'passkey'
  if (mode === 'phantom') return 'phantom'
  return 'freighter'
}

export function buildSendRequestFromDraft(
  draft: SendDraft,
  account: StoredAccount,
  priceUsd: number | null
): BuildSendTxRequest | null {
  if (!account.smartAccountAddress || !draft.token || !draft.recipientAddress.trim()) return null
  const amount = sendCryptoAmountFromDraft(draft, priceUsd)
  if (!amount) return null

  const signerType = accountToSignerType(account.mode)
  const req: BuildSendTxRequest = {
    smartAccountAddress: account.smartAccountAddress,
    signerType,
    recipient: draft.recipientAddress.trim(),
    amount,
  }

  if (draft.token.assetId) {
    req.assetId = draft.token.assetId
  } else {
    req.contractId = draft.token.sacContractId
  }

  if (signerType === 'freighter' && account.gAddress) {
    req.signerG = account.gAddress
  }

  return req
}

export function buildSetupRequestFromDraft(
  draft: SendDraft,
  account: StoredAccount,
  signingAccount?: StoredAccount
): SetupSendRulesRequest | null {
  if (!account.smartAccountAddress || !draft.token) return null
  const signerType = accountToSignerType(account.mode)
  const req: SetupSendRulesRequest = {
    smartAccountAddress: account.smartAccountAddress,
    signerType,
  }

  if (draft.token.assetId) {
    req.assetId = draft.token.assetId
  } else if (draft.token.code.toUpperCase() === 'XLM') {
    req.assetId = 'native'
  } else {
    req.assetId = draft.token.code
  }

  const passkeySource = account.mode === 'multisig' ? signingAccount : account

  if (signerType === 'passkey') {
    const keyDataHex = passkeySource?.passkeyKeyDataHex?.trim()
    if (!keyDataHex) return null
    req.keyDataHex = keyDataHex
    // Backend no longer requires verifierAddress to set up rules (Swagger omits it),
    // but keep sending it when configured for backwards compatibility.
    const verifierAddress = webauthnVerifierAddressFromEnv()
    if (verifierAddress) req.verifierAddress = verifierAddress
    const credentialId = passkeySource?.passkeyCredentialId?.trim()
    if (credentialId) {
      req.credentialId = credentialId
    }
  }
  if (signerType === 'phantom') {
    if (!account.phantomPublicKeyHex?.trim()) return null
    req.publicKeyHex = account.phantomPublicKeyHex
  }
  if (signerType === 'freighter') {
    if (!account.gAddress?.trim()) return null
    req.gAddress = account.gAddress
  }

  return req
}

export function isNoContextRuleError(error?: { code?: string; status?: number }): boolean {
  return error?.status === 409 && error?.code === 'NO_CONTEXT_RULE'
}

export function isSignerMismatchError(error?: { code?: string; status?: number }): boolean {
  return error?.status === 409 && error?.code === 'SIGNER_MISMATCH'
}

export function isBundlerMismatchError(error?: { code?: string; status?: number }): boolean {
  return error?.status === 409 && error?.code === 'BUNDLER_MISMATCH'
}

/** On-chain rules need reconfiguration (wrong signer type or stale bundler G). */
export function isSwapRuleReconfigureError(error?: { code?: string; status?: number }): boolean {
  return isSignerMismatchError(error) || isBundlerMismatchError(error)
}

/** Smart-account auth entry XDR to attach the passkey signature to on submit. */
export function resolvePasskeyAuthEntryXdr(build: BuildSendTxResponse): string {
  const normalized = normalizeDelegatedBuildFields(build)
  const entries = normalized.authEntriesXdr
  const idx = normalized.smartAccountAuthEntryIndex ?? 0
  if (entries?.length && entries[idx]) {
    return entries[idx]!
  }
  const xdr = normalized.authEntryXdr?.trim()
  if (!xdr) {
    throw new Error('Missing auth entry from transaction build.')
  }
  return xdr
}

/** Pass full auth entry list to submit when API built swap with bundler fee-payer. */
export function multiAuthSubmitFields(build: BuildSendTxResponse): {
  authEntriesXdr?: string[]
  smartAccountAuthEntryIndex?: number
  delegatedGAuthEntrySynthesized?: boolean
  delegatedNativeAuthEntryIndices?: number[]
} {
  if (!build.authEntriesXdr?.length) return {}
  return {
    authEntriesXdr: build.authEntriesXdr,
    smartAccountAuthEntryIndex: build.smartAccountAuthEntryIndex ?? 0,
    ...(build.delegatedGAuthEntrySynthesized === true
      ? { delegatedGAuthEntrySynthesized: true as const }
      : {}),
    ...(build.delegatedNativeAuthEntryIndices?.length
      ? { delegatedNativeAuthEntryIndices: build.delegatedNativeAuthEntryIndices }
      : {}),
  }
}

/** Extra submit-delegated fields for multi-auth swap/send (which G row the user signed). */
export function delegatedSubmitFields(
  build: BuildSendTxResponse,
  signedDelegatedEntryIndex: number
): {
  authEntriesXdr?: string[]
  smartAccountAuthEntryIndex?: number
  delegatedGAuthEntrySynthesized?: boolean
  delegatedNativeAuthEntryIndices?: number[]
  delegatedNativeAuthEntryIndex: number
} {
  return {
    ...multiAuthSubmitFields(build),
    delegatedNativeAuthEntryIndex: signedDelegatedEntryIndex,
  }
}

/** Map Render build-send fields (`authEntriesXdr` + indices) onto legacy delegated field names. */
export function normalizeDelegatedBuildFields(
  build: BuildSendTxResponse
): BuildSendTxResponse {
  const entries = build.authEntriesXdr
  if (!entries?.length) return build

  const next: BuildSendTxResponse = { ...build }

  const smartIdx = next.smartAccountAuthEntryIndex ?? 0
  if (!next.smartAccountAuthEntryXdr && entries[smartIdx]) {
    next.smartAccountAuthEntryXdr = entries[smartIdx]
  }

  if (!next.gAddressEntryTemplateXdr) {
    const delegatedIndices = next.delegatedNativeAuthEntryIndices
    if (delegatedIndices?.length) {
      const gIdx = delegatedIndices[0]!
      if (entries[gIdx]) next.gAddressEntryTemplateXdr = entries[gIdx]
    }
  }

  if (!next.authEntryXdr?.trim() && next.smartAccountAuthEntryXdr) {
    next.authEntryXdr = next.smartAccountAuthEntryXdr
  }

  return next
}

export function isDelegatedSendBuild(build: BuildSendTxResponse): build is BuildSendTxResponse & {
  gAddressEntryTemplateXdr: string
  smartAccountAuthEntryXdr: string
} {
  const b = normalizeDelegatedBuildFields(build)
  if (!b.gAddressEntryTemplateXdr || !b.smartAccountAuthEntryXdr) return false

  return (
    b.submitMethod === 'delegated' ||
    b.submitMethod === 'bundler-delegated' ||
    Boolean(b.gAddressPreimageXdr) ||
    (b.delegatedGAuthEntrySynthesized === true &&
      Boolean(b.delegatedNativeAuthEntryIndices?.length))
  )
}

export function contextRuleIdForSubmit(build: BuildSendTxResponse): number {
  const id = build.contextRuleId
  if (typeof id === 'number' && Number.isFinite(id)) return id

  const ruleIds = build.contextRuleIds
  if (Array.isArray(ruleIds) && ruleIds.length > 0) {
    const first = ruleIds[0]
    if (typeof first === 'number' && Number.isFinite(first)) return first
  }

  const parsed = Number.parseInt(String(id ?? ''), 10)
  if (!Number.isFinite(parsed)) {
    throw new Error('Missing or invalid contextRuleId from transaction build.')
  }
  return parsed
}

/** @deprecated Prefer `contextRuleIdForSubmit` for API bodies — Render expects JSON integer. */
export function contextRuleIdString(build: BuildSendTxResponse): string {
  return String(contextRuleIdForSubmit(build))
}

/** User-facing error when passkey setup payload cannot be built. */
export function passkeySetupPrerequisiteError(account: StoredAccount): string | null {
  if (accountToSignerType(account.mode) !== 'passkey') return null
  if (!account.passkeyKeyDataHex?.trim()) {
    return 'Missing passkey key data for this account. Log out and sign in with your passkey again.'
  }
  return null
}
