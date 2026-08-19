import type { StoredAccount } from '@latch/types'
import { signAuthEntry } from '@stellar/freighter-api'
import { Networks } from '@stellar/stellar-sdk'
import { startAuthentication } from '@simplewebauthn/browser'

import { friendlyError, sendToBackground } from './backgroundClient'
import {
  assertPasskeyAssertionMatchesAuthDigest,
  buildPasskeySigDataXdrFromAssertion,
  passkeyAuthenticationOptionsForAuthDigest,
  prepareAuthenticationOptionsForGet,
} from '../webauthn/passkey'
import { openPasskeyBridgeAndWait } from '../webauthn/passkeyBridge'
import { normalizeDelegatedSignatureBase64 } from '../../lib/delegatedAuthSubmit'
import { apiSignCosignRequest } from './cosignFlow'

async function prepareUnsignedCosign(unsignedTxXdr: string, linked: StoredAccount) {
  const res = await sendToBackground<
    { unsignedTxXdr: string; smartAccountAddress: string; linkedAccountId: string },
    import('@latch/types').PrepareSignResponse
  >({
    type: 'COSIGN_PREPARE_SIGN',
    payload: {
      unsignedTxXdr,
      smartAccountAddress: linked.smartAccountAddress,
      linkedAccountId: linked.id,
    },
  })
  if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
  return res.data
}

export async function approveCosignRequest(args: {
  requestId: string
  unsignedTxXdr: string
  multisigAccount: StoredAccount
  linkedAccount: StoredAccount
  surface: 'popup' | 'sidepanel'
}) {
  const prepared = await prepareUnsignedCosign(args.unsignedTxXdr, args.linkedAccount)
  const networkPassphrase =
    process.env.PLASMO_PUBLIC_STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET

  if (
    args.linkedAccount.mode === 'freighter' ||
    args.linkedAccount.mode === 'mnemonic'
  ) {
    const template =
      prepared.gAddressEntryTemplateXdr ??
      prepared.smartAccountAuthEntryXdr ??
      prepared.authEntryXdr
    if (!template) throw new Error('Missing delegated auth entry template')

    if (args.linkedAccount.mode === 'freighter') {
      if (!args.linkedAccount.gAddress) throw new Error('Missing G-address')
      const signed = await signAuthEntry(template, {
        networkPassphrase,
        address: args.linkedAccount.gAddress,
      })
      if (signed.error) throw new Error(signed.error.message ?? 'Freighter signing failed')
      const signedAuthEntryBase64 = normalizeDelegatedSignatureBase64(signed.signedAuthEntry)
      return apiSignCosignRequest({
        requestId: args.requestId,
        smartAccountAddress: args.multisigAccount.smartAccountAddress,
        linkedAccountId: args.linkedAccount.id,
        signedAuthEntryBase64,
      })
    }

    const signRes = await sendToBackground<
      import('@latch/types').SignDelegatedGAuthEntryRequest,
      import('@latch/types').SignDelegatedGAuthEntryResponse
    >({
      type: 'SIGN_DELEGATED_G_AUTH_ENTRY',
      payload: {
        accountId: args.linkedAccount.id,
        gAddressEntryTemplateXdr: template,
        networkPassphrase,
      },
    })
    if (!signRes.ok || !signRes.data) throw new Error(friendlyError(signRes.error))
    return apiSignCosignRequest({
      requestId: args.requestId,
      smartAccountAddress: args.multisigAccount.smartAccountAddress,
      linkedAccountId: args.linkedAccount.id,
      signedAuthEntryBase64: signRes.data.signedAuthEntryBase64,
    })
  }

  const authDigestHex = prepared.authDigestHex?.trim() ?? prepared.signaturePayloadHex?.trim()
  if (!authDigestHex) throw new Error('Missing auth digest for passkey cosign sign')
  const credentialId = args.linkedAccount.passkeyCredentialId?.trim()
  if (!credentialId) throw new Error('Missing passkey credential')

  const optionsJSON = passkeyAuthenticationOptionsForAuthDigest({
    authDigestHex,
    credentialId,
  })

  const assertion =
    args.surface === 'sidepanel'
      ? ((await openPasskeyBridgeAndWait({
          mode: 'authentication',
          optionsJSON,
        })) as Awaited<ReturnType<typeof startAuthentication>>)
      : await startAuthentication({
          optionsJSON: prepareAuthenticationOptionsForGet(optionsJSON),
        } as Parameters<typeof startAuthentication>[0])

  assertPasskeyAssertionMatchesAuthDigest(assertion, authDigestHex)
  const sigDataXdrHex = buildPasskeySigDataXdrFromAssertion(assertion)

  const attachRes = await sendToBackground<
    {
      unsignedTxXdr: string
      sigDataXdrHex: string
      keyDataHex: string
      contextRuleId: number
      authEntryXdr: string
    },
    { signedAuthEntryBase64: string }
  >({
    type: 'COSIGN_ATTACH_WEBAUTHN_AUTH',
    payload: {
      unsignedTxXdr: args.unsignedTxXdr,
      sigDataXdrHex,
      keyDataHex: args.linkedAccount.passkeyKeyDataHex ?? '',
      contextRuleId: Number(prepared.contextRuleId ?? 0),
      authEntryXdr:
        prepared.smartAccountAuthEntryXdr ?? prepared.authEntryXdr ?? '',
    },
  })
  if (!attachRes.ok || !attachRes.data) throw new Error(friendlyError(attachRes.error))

  return apiSignCosignRequest({
    requestId: args.requestId,
    smartAccountAddress: args.multisigAccount.smartAccountAddress,
    linkedAccountId: args.linkedAccount.id,
    signedAuthEntryBase64: attachRes.data.signedAuthEntryBase64,
  })
}
