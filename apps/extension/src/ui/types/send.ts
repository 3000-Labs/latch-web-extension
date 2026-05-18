import type { SmartAccountBalanceRow } from '@latch/types'

export type SendStep =
  | 'selectToken'
  | 'selectRecipient'
  | 'enterAmount'
  | 'summary'
  | 'success'
  | 'failure'
  | 'receipt'

export type SendInputMode = 'crypto' | 'fiat'

export type SendDraft = {
  token: SmartAccountBalanceRow | null
  recipientAddress: string
  recipientName?: string
  amount: string
  inputMode: SendInputMode
  memo?: string
}

export type SendResult = {
  status: 'success' | 'failure'
  hash?: string
  errorMessage?: string
  submittedAt?: string
}

export const INITIAL_SEND_DRAFT: SendDraft = {
  token: null,
  recipientAddress: '',
  amount: '',
  inputMode: 'crypto',
}
