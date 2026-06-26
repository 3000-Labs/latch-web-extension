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

import { normalizeDelegatedSignatureBase64 } from '../../lib/delegatedAuthSubmit'
import {
  buildPasskeySigDataXdrFromAssertion,
  enrichWebauthnRpIdHashErrorMessage,
  passkeyAuthenticationOptionsForAuthDigest,
} from '../webauthn/passkey'
import { openPasskeyBridgeAndWait } from '../webauthn/passkeyBridge'
import { bytesToHex } from '../webauthn/utils'
import { contextRuleIdString, isDelegatedSendBuild } from './sendTx'
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
    optionsJSON,
  } as Parameters<typeof startAuthentication>[0])
}

export async function signAndSubmitBuiltTx(args: {
  build: BuildSendTxResponse
  activeAccount: StoredAccount
  surface?: 'popup' | 'sidepanel'
  onProgress?: (label: string) => void
}): Promise<SubmitTxResponse> {
  const { build, activeAccount } = args
  const surface = args.surface ?? 'popup'
  const progress = args.onProgress ?? (() => {})

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
      if (!build.gAddressEntryTemplateXdr) {
        throw new Error('Missing delegated auth entry template from build response.')
      }
      const signed = await signAuthEntry(build.gAddressEntryTemplateXdr, {
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
          smartAccountAuthEntryXdr: build.smartAccountAuthEntryXdr,
          gAddressEntryTemplateXdr: build.gAddressEntryTemplateXdr,
          signedAuthEntryBase64,
          signerAddress,
        },
      })
      if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
      return submitRes.data ?? {}
    }

    const signRes = await sendToBackground<
      SignDelegatedGAuthEntryRequest,
      SignDelegatedGAuthEntryResponse
    >({
      type: 'SIGN_DELEGATED_G_AUTH_ENTRY',
      payload: {
        accountId: activeAccount.id,
        gAddressEntryTemplateXdr: build.gAddressEntryTemplateXdr,
        networkPassphrase: Networks.TESTNET,
      },
    })
    if (!signRes.ok) throw new Error(friendlyError(signRes.error))
    progress('Submitting…')
    const submitRes = await sendToBackground<SubmitDelegatedTxRequest, SubmitTxResponse>({
      type: 'SUBMIT_TX_DELEGATED',
      payload: {
        txXdr: build.txXdr,
        smartAccountAuthEntryXdr: build.smartAccountAuthEntryXdr,
        gAddressEntryTemplateXdr: build.gAddressEntryTemplateXdr,
        signedAuthEntryBase64: signRes.data!.signedAuthEntryBase64,
        signerAddress: signRes.data!.signerAddress,
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
        contextRuleId: contextRuleIdString(build),
      },
    })
    if (!submitRes.ok) throw new Error(friendlyError(submitRes.error))
    return submitRes.data ?? {}
  }

  if (!activeAccount.passkeyCredentialId || !activeAccount.passkeyKeyDataHex) {
    throw new Error('Missing passkey data for this account.')
  }
  if (!build.authDigestHex?.trim()) {
    throw new Error('Missing auth digest from transaction build.')
  }
  const optionsJSON = passkeyAuthenticationOptionsForAuthDigest({
    credentialId: activeAccount.passkeyCredentialId,
    authDigestHex: build.authDigestHex,
  })
  progress('Signing…')
  const assertion = await runPasskeyAuth(surface, optionsJSON)
  const sigDataXdr = buildPasskeySigDataXdrFromAssertion(assertion)
  progress('Submitting…')
  const submitRes = await sendToBackground<SubmitWebauthnTxRequest, SubmitTxResponse>({
    type: 'SUBMIT_TX_WEBAUTHN',
    payload: {
      txXdr: build.txXdr,
      authEntryXdr: build.authEntryXdr,
      sigDataXdr,
      keyDataHex: activeAccount.passkeyKeyDataHex,
      contextRuleId: contextRuleIdString(build),
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
