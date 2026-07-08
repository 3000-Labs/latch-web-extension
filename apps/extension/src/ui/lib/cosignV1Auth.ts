import { startAuthentication } from '@simplewebauthn/browser'

import { friendlyError, sendToBackground } from './backgroundClient'
import {
  assertPasskeyAssertionMatchesV1Challenge,
  narrowAuthenticationOptionsToCredential,
  prepareAuthenticationOptionsForGet,
} from '../webauthn/passkey'
import { openPasskeyBridgeAndWait } from '../webauthn/passkeyBridge'

async function tryEnsureV1Auth(linkedAccountId: string): Promise<boolean> {
  const res = await sendToBackground<{ linkedAccountId: string }, { ok: true }>({
    type: 'COSIGN_ENSURE_V1_AUTH',
    payload: { linkedAccountId },
  })
  return res.ok
}

async function signInWithPasskey(args: {
  linkedAccountId: string
  credentialId: string
  surface: 'popup' | 'sidepanel'
}) {
  const challengeRes = await sendToBackground<
    { linkedAccountId: string },
    { wallet: string; nonce: string; keyType: string; optionsJSON: unknown }
  >({
    type: 'COSIGN_V1_AUTH_CHALLENGE',
    payload: { linkedAccountId: args.linkedAccountId },
  })
  if (!challengeRes.ok || !challengeRes.data) {
    throw new Error(friendlyError(challengeRes.error))
  }
  const { wallet, nonce, keyType, optionsJSON } = challengeRes.data

  const narrowed = narrowAuthenticationOptionsToCredential(optionsJSON, args.credentialId)
  const prepared = prepareAuthenticationOptionsForGet(narrowed)

  const assertion =
    args.surface === 'sidepanel'
      ? ((await openPasskeyBridgeAndWait({
          mode: 'authentication',
          optionsJSON: prepared,
        })) as Awaited<ReturnType<typeof startAuthentication>>)
      : await startAuthentication({
          optionsJSON: prepared,
        } as Parameters<typeof startAuthentication>[0])

  assertPasskeyAssertionMatchesV1Challenge(assertion, nonce)

  const signInRes = await sendToBackground<
    {
      linkedAccountId: string
      wallet: string
      keyType: string
      nonce: string
      response: unknown
    },
    { ok: true }
  >({
    type: 'COSIGN_V1_AUTH_SIGN_IN',
    payload: {
      linkedAccountId: args.linkedAccountId,
      wallet,
      keyType,
      nonce,
      response: assertion,
    },
  })
  if (!signInRes.ok) throw new Error(friendlyError(signInRes.error))
}

/** Ensure JWT is available for cosign `/v1/*` calls for the linked signing account. */
export async function ensureCosignV1Auth(args: {
  linkedAccountId: string
  passkeyCredentialId?: string
  surface: 'popup' | 'sidepanel'
}): Promise<void> {
  if (await tryEnsureV1Auth(args.linkedAccountId)) return

  const credentialId = args.passkeyCredentialId?.trim()
  if (!credentialId) {
    throw new Error('V1 auth required — sign in with a passkey account first')
  }
  await signInWithPasskey({
    linkedAccountId: args.linkedAccountId,
    credentialId,
    surface: args.surface,
  })
  if (!(await tryEnsureV1Auth(args.linkedAccountId))) {
    throw new Error('V1 auth failed after sign-in')
  }
}
