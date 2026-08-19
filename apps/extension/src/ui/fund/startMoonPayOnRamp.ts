import type { CreateDepositIntentRequest, DepositIntent } from '@latch/types'

import { friendlyError, sendToBackground } from '../lib/backgroundClient'
import { ensureV1Auth } from '../lib/v1Auth'

export async function createDepositIntentForAccount(args: {
  accountId: string
  passkeyCredentialId?: string
  surface: 'popup' | 'sidepanel'
  openMoonPay?: boolean
}): Promise<DepositIntent> {
  if (!args.accountId.trim()) {
    throw new Error('No active account selected')
  }

  // Minting requires a Bearer JWT. Prompt passkey (or reuse cached token) first so
  // CREATE_DEPOSIT_INTENT does not fail before the user has authenticated.
  if (args.passkeyCredentialId?.trim()) {
    await ensureV1Auth({
      linkedAccountId: args.accountId,
      passkeyCredentialId: args.passkeyCredentialId,
      surface: args.surface,
    })
  }

  const tryCreate = () =>
    sendToBackground<CreateDepositIntentRequest, DepositIntent>({
      type: 'CREATE_DEPOSIT_INTENT',
      payload: {
        accountId: args.accountId,
        openMoonPay: args.openMoonPay,
      },
    })

  let res = await tryCreate()
  if (!res.ok && (res.error?.code === 'V1_AUTH_REQUIRED' || res.error?.status === 401)) {
    await ensureV1Auth({
      linkedAccountId: args.accountId,
      passkeyCredentialId: args.passkeyCredentialId,
      surface: args.surface,
    })
    res = await tryCreate()
  }

  if (!res) {
    throw new Error('No response from background — reload the Latch extension and try again')
  }
  if (!res.ok) {
    throw new Error(friendlyError(res.error))
  }
  if (!res.data?.memo_id || !res.data?.pool_address) {
    throw new Error(
      res.error
        ? friendlyError(res.error)
        : 'Deposit intent failed (empty response). Reload the Latch extension on chrome://extensions and try again.'
    )
  }
  return res.data
}

export async function startMoonPayOnRamp(args: {
  accountId: string
  passkeyCredentialId?: string
  surface: 'popup' | 'sidepanel'
}): Promise<DepositIntent> {
  return createDepositIntentForAccount({
    ...args,
    openMoonPay: true,
  })
}
