import type {
  BackendWebauthnBeginResponse,
  MultisigDraft,
  MultisigDraftMemberRequest,
  MultisigDraftPasskeyRegFinishResponse,
  MultisigJoinPreviewResponse,
} from '@latch/types'

import { latchFetch } from './client'
import { normalizeJoinPreview, unwrapMultisigDraft } from './multisigNormalize'
import { webauthnBeginBody, webauthnFinishBody } from './webauthn'

export async function getMultisigDraftByInviteToken(
  token: string
): Promise<MultisigJoinPreviewResponse> {
  const raw = await latchFetch<MultisigJoinPreviewResponse>(
    `/api/multisig/join/${encodeURIComponent(token)}`,
    { method: 'GET' }
  )
  return normalizeJoinPreview(raw)
}

export async function joinMultisigDraft(args: {
  token: string
  member: MultisigDraftMemberRequest
}): Promise<MultisigDraft> {
  const raw = await latchFetch<MultisigDraft>(
    `/api/multisig/join/${encodeURIComponent(args.token)}/members`,
    {
      method: 'POST',
      body: JSON.stringify(args.member),
    }
  )
  return unwrapMultisigDraft(raw) ?? raw
}

export async function multisigJoinPasskeyRegBegin(args: {
  token: string
  displayName?: string
}): Promise<BackendWebauthnBeginResponse> {
  const extra: Record<string, unknown> = {}
  if (args.displayName) extra.displayName = args.displayName
  return await latchFetch<BackendWebauthnBeginResponse>(
    `/api/multisig/join/${encodeURIComponent(args.token)}/webauthn/register/begin`,
    { method: 'POST', body: webauthnBeginBody(extra) }
  )
}

export async function multisigJoinPasskeyRegFinish(args: {
  token: string
  response: unknown
}): Promise<MultisigDraftPasskeyRegFinishResponse> {
  return await latchFetch<MultisigDraftPasskeyRegFinishResponse>(
    `/api/multisig/join/${encodeURIComponent(args.token)}/webauthn/register/finish`,
    {
      method: 'POST',
      body: webauthnFinishBody({ response: args.response }, 'registration'),
    }
  )
}

export async function multisigJoinPasskeyAuthBegin(args: {
  token: string
  displayName?: string
}): Promise<BackendWebauthnBeginResponse> {
  const extra: Record<string, unknown> = {}
  if (args.displayName) extra.displayName = args.displayName
  return await latchFetch<BackendWebauthnBeginResponse>(
    `/api/multisig/join/${encodeURIComponent(args.token)}/webauthn/authenticate/begin`,
    { method: 'POST', body: webauthnBeginBody(extra) }
  )
}

export async function multisigJoinPasskeyAuthFinish(args: {
  token: string
  response: unknown
}): Promise<MultisigDraftPasskeyRegFinishResponse> {
  return await latchFetch<MultisigDraftPasskeyRegFinishResponse>(
    `/api/multisig/join/${encodeURIComponent(args.token)}/webauthn/authenticate/finish`,
    {
      method: 'POST',
      body: webauthnFinishBody({ response: args.response }, 'authentication'),
    }
  )
}
