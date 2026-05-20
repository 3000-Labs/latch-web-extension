import React, { useState } from 'react'
import { Pencil } from 'lucide-react'

import type { SwapDraft, SwapQuoteVm } from '../swap/swapVm'
import { truncateAddress } from '../swap/swapVm'
import { ConfirmHeader } from '../swap/components/ConfirmHeader'
import { ConfirmRow } from '../swap/components/ConfirmRow'
import { TokenAvatar } from '../components/TokenAvatar'
import { SettingsToggle } from './settings/SettingsToggle'
import liquidMeshLogo from 'url:../../../assets/brand/LiquidMesh.png'

export function ConfirmSwapScreen({
  surface,
  draft,
  quote,
  onBackOrCancel,
  onConfirm,
}: {
  surface: 'popup' | 'sidepanel'
  draft: SwapDraft
  quote: SwapQuoteVm
  onBackOrCancel: () => void
  onConfirm: () => void
}) {
  const [mevProtection, setMevProtection] = useState(false)

  const fromAddr = '0xb3008e9f0b2c7028d'
  const gasAccount = '0x6A4A95670d'
  const receiveAddr = gasAccount

  const shortFromAddr = truncateAddress(fromAddr, 6, 6)
  const shortGasAddr = truncateAddress(gasAccount, 6, 6)
  const shortReceiveAddr = truncateAddress(receiveAddr, 6, 6)

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-screenIn">
      <ConfirmHeader onBack={onBackOrCancel} />

      <div className="mt-4 flex-1 space-y-4 overflow-auto pr-1 pb-4">
        {/* From Section */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted/60 uppercase tracking-wider px-1">
            From
          </span>
          <div className="flex items-center justify-between rounded-[24px] border border-border/20 bg-surface p-4">
            <div className="flex items-center gap-3">
              <TokenAvatar symbol="XLM" className="h-10 w-10" rounded="rounded-xl" />
              <div>
                <div className="text-sm font-extrabold text-fg">Unlimited Stellar</div>
                <div className="text-xs font-semibold text-muted/70 mt-0.5">
                  To: {shortFromAddr}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackOrCancel}
              className="text-muted hover:text-fg transition-colors"
              aria-label="Edit"
            >
              <Pencil className="h-4.5 w-4.5" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Spend Section */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted/60 uppercase tracking-wider px-1">
            Spend
          </span>
          <div className="flex items-center gap-3 rounded-[24px] border border-border/20 bg-surface p-4">
            <TokenAvatar symbol="USDT" className="h-10 w-10" rounded="rounded-xl" />
            <div>
              <div className="text-sm font-extrabold text-fg">-{draft.payAmount || '0'} USDT</div>
              <div className="text-xs font-semibold text-muted/70 mt-0.5">≈$1.00056</div>
            </div>
          </div>
        </div>

        {/* Receive Section */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted/60 uppercase tracking-wider px-1">
            Receive (Estimated)
          </span>
          <div className="flex items-center justify-between rounded-[24px] border border-border/20 bg-surface p-4">
            <div className="flex items-center gap-3">
              <TokenAvatar symbol="XLM" className="h-10 w-10" rounded="rounded-xl" />
              <div>
                <div className="text-sm font-extrabold text-fg">{quote.receiveAmountLine}</div>
                <div className="text-xs font-semibold text-muted/70 mt-0.5">
                  {quote.receiveUsdApproxLine || '≈$0.00'}
                </div>
              </div>
            </div>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border/30 border-t-primary" />
          </div>
        </div>

        {/* Details Section */}
        <div className="rounded-[24px] border border-border/20 bg-surface/50 p-4.5 space-y-3.5">
          <div className="flex items-center justify-between text-sm py-0.5">
            <span className="text-muted/70 font-semibold">MEV Protection</span>
            <SettingsToggle checked={mevProtection} onChange={setMevProtection} />
          </div>

          <ConfirmRow
            label="Gas Account"
            value={shortGasAddr}
            onClick={() => {}}
            showChevron={true}
          />

          <ConfirmRow
            label="Network Fee"
            value={
              <div className="flex flex-col items-end">
                <span className="text-sm">Fast</span>
                <span className="text-[10px] font-semibold text-muted/60 mt-0.5">
                  0.00004619 BNB ($0.05493)
                </span>
              </div>
            }
            onClick={() => {}}
            showChevron={true}
          />

          <ConfirmRow label="Min. Received" value={quote.minReceivedLine} />

          <div className="flex items-center justify-between text-sm py-0.5">
            <span className="text-muted/70 font-semibold">Provider</span>
            <div className="flex items-center gap-1.5 font-extrabold text-fg">
              <img
                src={liquidMeshLogo}
                className="h-3.5 w-3.5 shrink-0 rounded object-contain"
                alt="LiquidMesh"
              />
              <span>{quote.provider}</span>
            </div>
          </div>

          <ConfirmRow label="Receive Address" value={shortReceiveAddr} />
        </div>
      </div>

      {/* Footer Buttons */}
      <div
        className={[
          'mt-auto grid grid-cols-2 gap-3 pt-4',
          surface === 'sidepanel' ? 'pb-0' : 'pb-2',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={onBackOrCancel}
          className="h-12 rounded-full border border-border/25 bg-surface text-sm font-extrabold text-fg shadow-soft hover:bg-surface/75 active:scale-[0.98] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-12 rounded-full bg-primary text-sm font-extrabold text-black shadow-soft hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
        >
          Confirm Swap
        </button>
      </div>
    </div>
  )
}
