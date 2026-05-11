export type TokenVm = {
  id: string
  symbol: string
  name: string
  balance: string
  balanceUsd: string
  changePct: string
}

export type HistoryKind = "sent" | "received" | "deposit" | "swap"
export type HistoryStatus = "completed" | "pending"

export type HistoryItemVm = {
  id: string
  kind: HistoryKind
  asset: string
  status: HistoryStatus
  timeLabel: string
  amountUsd: string
}

export const mockTotalBalanceUsd = "0.00"

export const mockTokens: TokenVm[] = [
  {
    id: "xlm",
    symbol: "XLM",
    name: "Stellar",
    balance: "32.0000009",
    balanceUsd: "$5.00",
    changePct: "-0.09%"
  }
]

export const mockHistoryBySection: Array<{ title: string; items: HistoryItemVm[] }> = [
  {
    title: "Today",
    items: [
      { id: "tether-1", kind: "deposit", asset: "Tether", status: "completed", timeLabel: "2hrs ago", amountUsd: "+$505.00" },
      { id: "eth-1", kind: "deposit", asset: "Ethereum", status: "completed", timeLabel: "2hrs ago", amountUsd: "+$1,250.00" },
      { id: "swap-1", kind: "swap", asset: "Swap USDT → XLM", status: "completed", timeLabel: "3hrs ago", amountUsd: "~$1.00" },
      { id: "xlm-1", kind: "sent", asset: "Stellar", status: "pending", timeLabel: "3hrs ago", amountUsd: "+$1,250.00" },
      { id: "xlm-2", kind: "sent", asset: "Stellar", status: "pending", timeLabel: "6hrs ago", amountUsd: "+$1,250.00" }
    ]
  },
  {
    title: "Yesterday",
    items: [
      { id: "swap-2", kind: "swap", asset: "Swap XLM → USDT", status: "completed", timeLabel: "1d ago", amountUsd: "~$15.24" },
      { id: "tether-2", kind: "deposit", asset: "Tether", status: "completed", timeLabel: "2hrs ago", amountUsd: "+$505.00" }
    ]
  }
]

