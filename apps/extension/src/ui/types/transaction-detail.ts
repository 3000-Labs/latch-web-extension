export type TransactionDetailVm = {
  id: string
  transactionHash: string
  assetCode: string
  iconUrl?: string | null
  amountUsd: string
  status: 'completed' | 'pending'
  createdAt: string
  from: string
  to: string
  networkFee: string
  blockNumber: string
  networkLabel: string
  stepTimes: [string, string, string]
}
