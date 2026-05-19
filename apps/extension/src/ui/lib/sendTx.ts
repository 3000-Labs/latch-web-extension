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

export function sendCryptoAmountFromDraft(draft: SendDraft): string | null {
  if (!draft.token) return null
  if (draft.inputMode === 'crypto') {
    const trimmed = draft.amount.trim()
    return trimmed || null
  }
  return fiatToCrypto(draft.amount, draft.token.code)
}

export function accountToSignerType(mode: AccountMode): SendSignerType {
  if (mode === 'passkey') return 'passkey'
  if (mode === 'phantom') return 'phantom'
  return 'freighter'
}

export function buildSendRequestFromDraft(
  draft: SendDraft,
  account: StoredAccount,
): BuildSendTxRequest | null {
  if (!account.smartAccountAddress || !draft.token || !draft.recipientAddress.trim()) return null
  const amount = sendCryptoAmountFromDraft(draft)
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

  if (signerType === 'passkey') {
    const keyDataHex = account.passkeyKeyDataHex?.trim()
    if (!keyDataHex) return null
    const verifierAddress = webauthnVerifierAddressFromEnv()
    if (!verifierAddress) return null
    req.keyDataHex = keyDataHex
    req.verifierAddress = verifierAddress
  }
  if (signerType === 'phantom' && account.phantomPublicKeyHex) {
    req.publicKeyHex = account.phantomPublicKeyHex
  }
  if (signerType === 'freighter' && account.gAddress) {
    req.gAddress = account.gAddress
  }

  return req
}

export function isNoContextRuleError(error?: { code?: string; status?: number }): boolean {
  return error?.status === 409 && error?.code === 'NO_CONTEXT_RULE'
}

export function isDelegatedSendBuild(
  build: BuildSendTxResponse,
): build is BuildSendTxResponse & {
  gAddressPreimageXdr: string
  gAddressEntryTemplateXdr: string
  smartAccountAuthEntryXdr: string
} {
  return Boolean(
    build.gAddressPreimageXdr &&
      build.gAddressEntryTemplateXdr &&
      build.smartAccountAuthEntryXdr,
  )
}

export function contextRuleIdString(build: BuildSendTxResponse): string {
  return String(build.contextRuleId)
}

/** User-facing error when passkey setup payload cannot be built. */
export function passkeySetupPrerequisiteError(account: StoredAccount): string | null {
  if (accountToSignerType(account.mode) !== 'passkey') return null
  if (!account.passkeyKeyDataHex?.trim()) {
    return 'Missing passkey key data for this account. Log out and sign in with your passkey again.'
  }
  if (!webauthnVerifierAddressFromEnv()) {
    return 'Passkey send setup requires PLASMO_PUBLIC_WEBAUTHN_VERIFIER_ADDRESS in apps/extension/.env (same value as the Latch API). Restart pnpm dev after changing it.'
  }
  return null
}
