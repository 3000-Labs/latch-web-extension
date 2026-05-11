import React, { useState } from "react"
import { ChevronLeft, Pencil } from "lucide-react"

import { SectionCard } from "../components/SectionCard"
import type { SwapDraft, SwapQuoteVm } from "../swap/swapVm"
import { truncateAddress } from "../swap/swapVm"

function Row({
  label,
  value,
  right
}: {
  label: string
  value: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs font-extrabold text-muted">{label}</div>
      <div className="flex items-center gap-2 text-right">
        <div className="text-sm font-extrabold text-fg/90">{value}</div>
        {right}
      </div>
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "h-7 w-12 rounded-full border border-border p-1 transition-colors",
        checked ? "bg-primary/80" : "bg-surface/60"
      ].join(" ")}
    >
      <span
        className={[
          "block h-5 w-5 rounded-full bg-bg shadow-soft transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        ].join(" ")}
      />
    </button>
  )
}

export function ConfirmSwapScreen({
  surface,
  draft,
  quote,
  onBackOrCancel,
  onConfirm
}: {
  surface: "popup" | "sidepanel"
  draft: SwapDraft
  quote: SwapQuoteVm
  onBackOrCancel: () => void
  onConfirm: () => void
}) {
  const [mevProtection, setMevProtection] = useState(false)

  const fromAddr = "0xb3008e9f0b2c7028d"
  const gasAccount = "0x6A4A95670d"
  const receiveAddr = gasAccount

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between">
        <button
          onClick={onBackOrCancel}
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/40 text-fg/80 hover:bg-surface/60"
          aria-label="Back"
        >
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
        <div className="text-base font-extrabold">Confirm Swap</div>
        <div className="w-9" />
      </div>

      <div className="mt-5 space-y-3">
        <SectionCard className="bg-surface/40">
          <div className="text-xs font-extrabold text-muted">From</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/20 text-primary">
                <span className="text-sm font-extrabold">S</span>
              </span>
              <div>
                <div className="text-sm font-extrabold">Unlimited Stellar</div>
                <div className="text-xs font-bold text-muted">To: {truncateAddress(fromAddr, 6, 6)}</div>
              </div>
            </div>
            <button type="button" className="text-fg/70 hover:text-fg" aria-label="Edit">
              <Pencil className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </SectionCard>

        <SectionCard className="bg-surface/40">
          <div className="text-xs font-extrabold text-muted">Spend</div>
          <div className="mt-3">
            <div className="text-xl font-extrabold tracking-tight">- {draft.payAmount || "0"} USDT</div>
            <div className="text-xs font-bold text-muted">~$1.00056</div>
          </div>
        </SectionCard>

        <SectionCard className="bg-surface/40">
          <div className="text-xs font-extrabold text-muted">Receive (Estimated)</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xl font-extrabold tracking-tight">{quote.receiveAmountLine}</div>
              <div className="text-xs font-bold text-muted">{quote.receiveUsdApproxLine}</div>
            </div>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden />
          </div>
        </SectionCard>

        <SectionCard className="bg-surface/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-muted">MEV Protection</div>
              <Switch checked={mevProtection} onChange={setMevProtection} />
            </div>
            <Row label="Gas Account" value={truncateAddress(gasAccount, 6, 5)} />
            <Row label="Network Fee" value={<span className="text-fg/90">Fast</span>} right={<span className="text-xs font-bold text-muted">0.00004619 BNB ($0.05493)</span>} />
            <Row label="Min. Received" value={quote.minReceivedLine} />
            <Row label="Provider" value={quote.provider} />
            <Row label="Receive Address" value={truncateAddress(receiveAddr, 6, 5)} />
          </div>
        </SectionCard>
      </div>

      <div className={["mt-auto grid grid-cols-2 gap-3 pt-5", surface === "sidepanel" ? "pb-0" : ""].join(" ")}>
        <button
          type="button"
          onClick={onBackOrCancel}
          className="h-12 rounded-full border border-border bg-surface text-base font-extrabold text-fg shadow-soft hover:bg-surface/80"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-12 rounded-full bg-primary text-base font-extrabold text-black shadow-soft hover:brightness-95 active:brightness-90"
        >
          Confirm Swap
        </button>
      </div>
    </div>
  )
}

