import type {
  BuildSendTxResponse,
  SignDelegatedGAuthEntryRequest,
  SignDelegatedGAuthEntryResponse,
  StoredAccount,
  SubmitDelegatedTxRequest,
  SubmitPhantomTxRequest,
  SubmitTxResponse,
  SubmitWebauthnTxRequest,
} from '@latch/types'

import { signAuthEntry } from '@stellar/freighter-api'
import { Networks } from '@stellar/stellar-sdk'
import { startAuthentication } from '@simplewebauthn/browser'

import { normalizeDelegatedSignatureBase64, resolveDelegatedAuthEntryForSigner } from '../../lib/delegatedAuthSubmit'
import {
  assertPasskeyAssertionMatchesAuthDigest,
  buildPasskeySigDataXdrFromAssertion,
  enrichWebauthnRpIdHashErrorMessage,
  passkeyAuthenticationOptionsForAuthDigest,
  prepareAuthenticationOptionsForGet,
} from '../webauthn/passkey'
import { openPasskeyBridgeAndWait } from '../webauthn/passkeyBridge'
import { bytesToHex } from '../webauthn/utils'
import {
  contextRuleIdForSubmit,
  delegatedSubmitFields,
  isDelegatedSendBuild,
  multiAuthSubmitFields,
  normalizeDelegatedBuildFields,
  resolvePasskeyAuthEntryXdr,
} from './sendTx'
import { friendlyError, sendToBackground } from './backgroundClient'

type PhantomSolanaProvider = {
  signMessage(message: Uint8Array): Promise<Uint8Array | { signature: Uint8Array }>
}

export function extractTransactionHash(data: SubmitTxResponse | null | undefined): string | undefined {
  if (!data) return undefined
  if (typeof data.transactionHash === 'string') return data.transactionHash
  if (typeof data.hash === 'string') return data.hash
  return undefined
}

async function runPasskeyAuth(
  surface: 'popup' | 'sidepanel',
  optionsJSON: unknown
): Promise<Awaited<ReturnType<typeof startAuthentication>>> {
  if (surface === 'sidepanel') {
    return (await openPasskeyBridgeAndWait({
      mode: 'authentication',
      optionsJSON,
    })) as Awaited<ReturnType<typeof startAuthentication>>
  }
  return await startAuthentication({
    optionsJSON: prepareAuthenticationOptionsForGet(optionsJSON),
  } as Parameters<typeof startAuthentication>[0])
}

export async function signAndSubmitBuiltTx(args: {
  build: BuildSendTxResponse
  activeAccount: StoredAccount
  /** When `activeAccount.mode === 'multisig'`, passkey credentials from this account. */
  signingAccount?: StoredAccount
  surface?: 'popup' | 'sidepanel'
  onProgress?: (label: string) => void
}): Promise<SubmitTxResponse> {
  const { build: rawBuild, activeAccount } = args
  const build = normalizeDelegatedBuildFields(rawBuild)
  const surface = args.surface ?? 'popup'
  const progress = args.onProgress ?? (() => {})
  const passkeySource =
    activeAccount.mode === 'multisig' ? (args.signingAccount ?? activeAccount) : activeAccount

  if (
    (activeAccount.mode === 'freighter' || activeAccount.mode === 'mnemonic') &&
    isDelegatedSendBuild(build)
  ) {
    if (activeAccount.mode === 'freighter') {
      if (!activeAccount.gAddress) throw new Error('Missing G-address for freighter account')
      const networkPassphrase =
        process.env.PLASMO_PUBLIC_STELLAR_NETWORK === 'mainnet'
          ? Networks.PUBLIC
          : Networks.TESTNET
      const delegated = resolveDelegatedAuthEntryForSigner({
        authEntriesXdr: build.authEntriesXdr,
        delegatedNativeAuthEntryIndices: build.delegatedNativeAuthEntryIndices,
        gAddressEntryTemplateXdr: build.gAddressEntryTemplateXdr,
        signerG: activeAccount.gAddress,
      })
      if (!delegated) {
        throw new Error('Could not find delegated auth entry for your G-address in this transaction.')
      }
      const signed = await signAuthEntry(delegated.templateXdr, {
        networkPassphrase,
        address: activeAccount.gAddress,
      })
      if (signed.error) throw new Error(signed.error.message ?? 'Freighter signing failed.')
      const signerAddress = signed.signerAddress
      const signedAuthEntryBase64 = signed.signedAuthEntry
        ? normalizeDelegatedSignatureBase64(signed.signedAuthEntry)
        : undefined
      if (!signedAuthEntryBase64 || !signerAddress) throw new Error('Freighter signing failed.')
      progress('Submitting…')
      const submitRes = await sendToBackground<SubmitDelegatedTxRequest, SubmitTxResponse>({
        type: 'SUBMIT_TX_DELEGATED',
        payload: {
          txXdr: build.txXdr,
          smartAccountAuthEntryXdr: build.smartAccountAuthEntryXdr!,
          gAddressEntryTemplateXdr: delegated.templateXdr,
          signedAuthEntryBase64,
          signerAddress,
          contextRuleId: contextRuleIdForSubmit(build),
          ...delegatedSubmitFields(build, delegated.entryIndex),
        },
      })
      if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
      return submitRes.data ?? {}
    }

    const delegated = resolveDelegatedAuthEntryForSigner({
      authEntriesXdr: build.authEntriesXdr,
      delegatedNativeAuthEntryIndices: build.delegatedNativeAuthEntryIndices,
      gAddressEntryTemplateXdr: build.gAddressEntryTemplateXdr,
      signerG: activeAccount.gAddress ?? '',
    })
    if (!delegated) {
      throw new Error('Could not find delegated auth entry for this account in the transaction.')
    }

    const signRes = await sendToBackground<
      SignDelegatedGAuthEntryRequest,
      SignDelegatedGAuthEntryResponse
    >({
      type: 'SIGN_DELEGATED_G_AUTH_ENTRY',
      payload: {
        accountId: activeAccount.id,
        gAddressEntryTemplateXdr: delegated.templateXdr,
        networkPassphrase: Networks.TESTNET,
      },
    })
    if (!signRes.ok) throw new Error(friendlyError(signRes.error))
    progress('Submitting…')
    const submitRes = await sendToBackground<SubmitDelegatedTxRequest, SubmitTxResponse>({
      type: 'SUBMIT_TX_DELEGATED',
      payload: {
        txXdr: build.txXdr,
        smartAccountAuthEntryXdr: build.smartAccountAuthEntryXdr!,
        gAddressEntryTemplateXdr: delegated.templateXdr,
        signedAuthEntryBase64: signRes.data!.signedAuthEntryBase64,
        signerAddress: signRes.data!.signerAddress,
        contextRuleId: contextRuleIdForSubmit(build),
        ...delegatedSubmitFields(build, delegated.entryIndex),
      },
    })
    if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
    return submitRes.data ?? {}
  }

  if (activeAccount.mode === 'phantom') {
    const provider = (window as unknown as { phantom?: { solana?: PhantomSolanaProvider } }).phantom
      ?.solana
    if (!provider) throw new Error('Phantom not detected.')
    const digest = build.authDigestHex.toLowerCase()
    const prefixedMessage = `Stellar Smart Account Auth:\n${digest}`
    const msgBytes = new TextEncoder().encode(prefixedMessage)
    const signed = await provider.signMessage(msgBytes)
    const sigBytes: Uint8Array =
      signed instanceof Uint8Array ? signed : (signed.signature ?? new Uint8Array())
    if (sigBytes.length === 0) throw new Error('Phantom signing failed.')
    progress('Submitting…')
    const submitRes = await sendToBackground<SubmitPhantomTxRequest, SubmitTxResponse>({
      type: 'SUBMIT_TX_PHANTOM',
      payload: {
        txXdr: build.txXdr,
        authEntryXdr: build.authEntryXdr,
        authSignatureHex: bytesToHex(sigBytes),
        prefixedMessage,
        publicKeyHex: activeAccount.phantomPublicKeyHex ?? '',
        contextRuleId: contextRuleIdForSubmit(build),
      },
    })
    if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
    return submitRes.data ?? {}
  }

  if (!passkeySource.passkeyCredentialId || !passkeySource.passkeyKeyDataHex) {
    throw new Error(
      activeAccount.mode === 'multisig'
        ? 'No passkey account is available to sign for this multisig wallet.'
        : 'Missing passkey data for this account.'
    )
  }
  if (
    isDelegatedSendBuild(build) &&
    (build.submitMethod === 'delegated' || build.submitMethod === 'bundler-delegated')
  ) {
    throw new Error(
      'This smart account authorizes swaps via a delegated G-address, not your passkey. ' +
        'Reconnect with Freighter using the delegated signer G-address, or log out and sign in with passkey to run one-time swap setup.'
    )
  }
  if (!build.authDigestHex?.trim()) {
    throw new Error('Missing auth digest from transaction build.')
  }
  const optionsJSON = passkeyAuthenticationOptionsForAuthDigest({
    credentialId: passkeySource.passkeyCredentialId,
    authDigestHex: build.authDigestHex,
  })
  progress('Signing…')
  const assertion = await runPasskeyAuth(surface, optionsJSON)
  assertPasskeyAssertionMatchesAuthDigest(assertion, build.authDigestHex)
  const sigDataXdr = buildPasskeySigDataXdrFromAssertion(assertion)
  progress('Submitting…')
  const submitRes = await sendToBackground<SubmitWebauthnTxRequest, SubmitTxResponse>({
    type: 'SUBMIT_TX_WEBAUTHN',
    payload: {
      txXdr: build.txXdr,
      authEntryXdr: resolvePasskeyAuthEntryXdr(build),
      sigDataXdr,
      keyDataHex: passkeySource.passkeyKeyDataHex,
      contextRuleId: contextRuleIdForSubmit(build),
      ...multiAuthSubmitFields(build),
    },
  })
  if (!submitRes.ok) {
    const errMsg = friendlyError(submitRes.error)
    throw new Error(
      await enrichWebauthnRpIdHashErrorMessage(errMsg, {
        optionsJSON,
        credentialResponse: assertion,
      })
    )
  }
  return submitRes.data ?? {}
}
