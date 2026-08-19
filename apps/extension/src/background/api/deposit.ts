import type { DepositIntent, DepositStatus } from '@latch/types'

import { v1FetchForWallet } from './v1Client'

/**
 * Mint a TTL-bound latch-relayer funding intent for the smart account.
 *
 * Auth: wallet-scope JWT from POST /v1/auth/challenge + /v1/auth/sign-in only.
 * Do not call POST /v1/accounts/register — mobile Fund skips it; ownership is
 * implied by the JWT subject + smart_account_address on this request.
 */
export async function createDepositIntent(
  wallet: string,
  smartAccountAddress: string
): Promise<DepositIntent> {
  return await v1FetchForWallet<DepositIntent>(wallet, '/v1/accounts/deposit-intent', {
    method: 'POST',
    body: JSON.stringify({ smart_account_address: smartAccountAddress }),
  })
}

export async function fetchDepositIntentStatus(
  wallet: string,
  memoId: string
): Promise<DepositStatus> {
  return await v1FetchForWallet<DepositStatus>(
    wallet,
    `/v1/accounts/deposit/status/${encodeURIComponent(memoId)}`,
    { method: 'GET' }
  )
}
