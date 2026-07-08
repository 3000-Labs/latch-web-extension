import { v1FetchForWallet } from '../v1Client'

export async function storeWCKBundle(
  wallet: string,
  pickupKey: string,
  bundle: string
): Promise<{ message: string; updated_at?: string }> {
  return v1FetchForWallet(wallet, `/v1/wck-bundles/${encodeURIComponent(pickupKey)}`, {
    method: 'PUT',
    body: JSON.stringify({ bundle }),
  })
}

export async function getWCKBundle(wallet: string, pickupKey: string): Promise<string> {
  const data = await v1FetchForWallet<{ bundle: string }>(
    wallet,
    `/v1/wck-bundles/${encodeURIComponent(pickupKey)}`,
    { method: 'GET' }
  )
  return data.bundle
}
