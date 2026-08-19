export type PermissionDuration = '1 Hour' | '1 Day' | '1 Week' | '1 Month'

export type PermissionAction = 'Transfer' | 'Swap' | 'Offers'

export type SessionKeyPermission = {
  id: string
  name: string
  duration: PermissionDuration
  spendingLimitAmount: string // numeric display (e.g. "1,000,000.00" or "1,000,000")
  spendingLimitCurrency: 'USDC'
  allowed: PermissionAction[]
}

export type SessionKeyDraft = Omit<SessionKeyPermission, 'id'>
