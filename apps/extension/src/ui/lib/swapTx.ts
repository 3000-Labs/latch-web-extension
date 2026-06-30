import type {
  BuildSendTxResponse,
  Network,
  SetupSwapRulesRequest,
  StoredAccount,
  SwapQuotePayload,
} from '@latch/types'

import { AQUARIUS_CONFIG } from '@latch/swap'

import { webauthnVerifierAddressFromEnv } from './latchEnv'
import { accountToSignerType, isDelegatedSendBuild, passkeySetupPrerequisiteError } from './sendTx'

function stellarNetworkFromEnv(): Network {
  return process.env.PLASMO_PUBLIC_STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
}

export function resolveSwapRouterContractId(
  quote: SwapQuotePayload,
  network: Network = stellarNetworkFromEnv()
): string | null {
  const payload = quote.buildPayload as { routerContractId?: string; kind?: string }
  if (payload.routerContractId?.startsWith('C')) return payload.routerContractId

  if (quote.providerId === 'aquarius') {
    return AQUARIUS_CONFIG[network].routerContractId
  }

  return null
}

export function buildSetupSwapRequestFromQuote(
  quote: SwapQuotePayload,
  account: StoredAccount
): SetupSwapRulesRequest | null {
  if (!account.smartAccountAddress) return null

  const network = stellarNetworkFromEnv()
  const routerContractId = resolveSwapRouterContractId(quote, network)
  if (!routerContractId) return null

  const signerType = accountToSignerType(account.mode)
  const req: SetupSwapRulesRequest = {
    smartAccountAddress: account.smartAccountAddress,
    signerType,
    network,
    providerId: quote.providerId,
    routerContractId,
  }

  if (signerType === 'passkey') {
    const keyDataHex = account.passkeyKeyDataHex?.trim()
    if (!keyDataHex) return null
    const verifierAddress = webauthnVerifierAddressFromEnv()
    if (!verifierAddress) return null
    req.keyDataHex = keyDataHex
    req.verifierAddress = verifierAddress
    if (account.passkeyCredentialId?.trim()) {
      req.credentialId = account.passkeyCredentialId.trim()
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

export function swapSetupPrerequisiteError(
  account: StoredAccount,
  quote: SwapQuotePayload
): string | null {
  const passkeyErr = passkeySetupPrerequisiteError(account)
  if (passkeyErr) return passkeyErr
  const signerType = accountToSignerType(account.mode)
  if (signerType === 'freighter' && !account.gAddress?.trim()) {
    return 'Missing Freighter G-address for this account. Reconnect Freighter in Settings.'
  }
  if (signerType === 'phantom' && !account.phantomPublicKeyHex?.trim()) {
    return 'Missing Phantom public key for this account. Reconnect Phantom in Settings.'
  }
  if (!resolveSwapRouterContractId(quote)) {
    return 'Swap router is not configured for this provider.'
  }
  return null
}

/** True when API built a bundler-only swap auth path but the user signs with passkey/phantom. */
export function swapBuildNeedsSignerReconfigure(
  build: BuildSendTxResponse,
  account: StoredAccount
): boolean {
  const signerType = accountToSignerType(account.mode)

  if (
    signerType === 'freighter' &&
    (build.submitMethod === 'delegated' || build.submitMethod === 'bundler-delegated') &&
    isDelegatedSendBuild(build)
  ) {
    return false
  }

  if (signerType !== 'passkey' && signerType !== 'phantom') return false

  const submitMethod = build.submitMethod
  if (submitMethod === 'bundler-delegated') return true

  // Older APIs may omit submitMethod while still prefilling Delegated(bundler) on the smart-account entry.
  if (
    build.smartAccountAuthEntryXdr &&
    !build.gAddressEntryTemplateXdr &&
    build.delegatedGAuthEntrySynthesized === true
  ) {
    return true
  }

  return false
}
