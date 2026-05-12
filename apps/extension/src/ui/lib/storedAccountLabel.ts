import type { StoredAccount } from '@latch/types'

export function storedAccountLabel(account: StoredAccount, index: number): string {
  const t = account.label?.trim()
  return t ? t : `Account ${index + 1}`
}
