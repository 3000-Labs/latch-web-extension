import type { AnnounceMembershipRequest, WalletMembership } from '@latch/types'

import { v1FetchForWallet } from '../v1Client'

export async function announceMembership(
  wallet: string,
  req: AnnounceMembershipRequest
): Promise<{ message: string }> {
  return v1FetchForWallet(wallet, '/v1/memberships', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function listMemberships(
  wallet: string,
  memberBlindId: string
): Promise<WalletMembership[]> {
  const data = await v1FetchForWallet<{ wallets: WalletMembership[] }>(
    wallet,
    `/v1/memberships?member_blind_id=${encodeURIComponent(memberBlindId)}`,
    { method: 'GET' }
  )
  return data.wallets ?? []
}
