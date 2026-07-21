import type {
  BackgroundMessage,
  CreateDepositIntentRequest,
  DepositIntent,
  GetDepositIntentStatusRequest,
} from '@latch/types'

import { BackendError } from '../api/client'
import { createDepositIntent, fetchDepositIntentStatus } from '../api/deposit'
import { openMoonPayBuyTab } from '../../lib/moonpayBuyUrl'
import { resolveAccessToken } from '../api/v1Client'
import { v1AuthWalletForLinkedAccount } from '../cosign/v1AuthWallet'
import { getAccounts } from '../storage'

type OkFn = (data?: unknown) => { ok: boolean; data?: unknown }

const FUNDABLE_MODES = new Set(['passkey', 'freighter', 'mnemonic', 'phantom'])

function assertDepositIntent(intent: DepositIntent): DepositIntent {
  const memoId = intent?.memo_id?.trim()
  const poolAddress = intent?.pool_address?.trim()
  const intentId = intent?.intent_id?.trim()
  if (!memoId || !poolAddress || !intentId) {
    throw new BackendError('Deposit intent response missing memo_id, pool_address, or intent_id', {
      status: 502,
      code: 'invalid_deposit_intent',
    })
  }
  return {
    intent_id: intentId,
    memo_id: memoId,
    pool_address: poolAddress,
    expires_at: intent.expires_at,
  }
}

export async function tryHandleDepositMessage(
  message: BackgroundMessage,
  sendResponse: (response: unknown) => void,
  ok: OkFn
): Promise<boolean> {
  switch (message.type) {
    case 'CREATE_DEPOSIT_INTENT': {
      const req = message.payload as CreateDepositIntentRequest
      const { accounts } = await getAccounts()
      const account = accounts.find((a) => a.id === req.accountId)
      if (!account) {
        throw new BackendError('Account not found', { status: 404, code: 'no_account' })
      }
      if (!FUNDABLE_MODES.has(account.mode)) {
        throw new BackendError('Fund via on-ramp is not available for this account type yet.', {
          status: 400,
          code: 'fund_unsupported_mode',
        })
      }
      const smartAccountAddress = account.smartAccountAddress?.trim()
      if (!smartAccountAddress) {
        throw new BackendError('Account missing smart account address', {
          status: 400,
          code: 'no_smart_account',
        })
      }

      const { wallet } = v1AuthWalletForLinkedAccount(account)
      await resolveAccessToken(wallet)

      const intent = assertDepositIntent(await createDepositIntent(wallet, smartAccountAddress))

      if (req.openMoonPay) {
        await openMoonPayBuyTab({
          poolAddress: intent.pool_address,
          memoId: intent.memo_id,
          intentId: intent.intent_id,
        })
      }

      sendResponse(ok(intent))
      return true
    }
    case 'GET_DEPOSIT_INTENT_STATUS': {
      const req = message.payload as GetDepositIntentStatusRequest
      const { accounts } = await getAccounts()
      const account = accounts.find((a) => a.id === req.accountId)
      if (!account) {
        throw new BackendError('Account not found', { status: 404, code: 'no_account' })
      }
      const { wallet } = v1AuthWalletForLinkedAccount(account)
      const status = await fetchDepositIntentStatus(wallet, req.memoId)
      sendResponse(ok(status))
      return true
    }
    default:
      return false
  }
}
