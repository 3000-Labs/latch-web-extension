import type { DepositIntent, DepositOnRampCrypto, DepositStatus } from '@latch/types'

import { v1FetchForWallet } from './v1Client'
import { withActiveNetwork } from './withActiveNetwork'

export type DepositOnRampProvider = 'moonpay' | 'transak'

export type CreateDepositIntentOptions = {
  provider?: DepositOnRampProvider
  cryptoCurrency?: DepositOnRampCrypto
}

/**
 * Mint a TTL-bound latch-relayer funding intent for the smart account.
 *
 * Auth: wallet-scope JWT from POST /v1/auth/challenge + /v1/auth/sign-in only.
 * Do not call POST /v1/accounts/register — mobile Fund skips it; ownership is
 * implied by the JWT subject + smart_account_address on this request.
 */
export async function createDepositIntent(
  wallet: string,
  smartAccountAddress: string,
  options?: CreateDepositIntentOptions
): Promise<DepositIntent> {
  const body: Record<string, unknown> = {
    smart_account_address: smartAccountAddress,
  }
  if (options?.provider) {
    body.provider = options.provider
  }
  if (options?.cryptoCurrency) {
    body.crypto_currency = options.cryptoCurrency
  }
  const payload = await withActiveNetwork(body)
  return await v1FetchForWallet<DepositIntent>(wallet, '/v1/accounts/deposit-intent', {
    method: 'POST',
    body: JSON.stringify(payload),
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
