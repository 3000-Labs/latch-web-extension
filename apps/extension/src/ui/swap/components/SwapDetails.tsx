import React from 'react'
import { ChevronRight, RefreshCw } from 'lucide-react'
import type { SwapQuoteVm } from '../swapVm'
import { KeyValueRow } from './KeyValueRow'
import liquidMeshLogo from 'url:../../../../assets/brand/LiquidMesh.png'

export function SwapDetails({ quote }: { quote: SwapQuoteVm }) {
  return (
    <div className="space-y-4 px-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted font-semibold">Route</span>
        <button
          type="button"
          className="flex items-center gap-2 font-extrabold text-fg hover:opacity-80 transition-opacity focus:outline-none"
        >
          <img
            src={liquidMeshLogo}
            className="h-3.5 w-3.5 shrink-0 rounded object-contain"
            alt=""
          />
          <span>{quote.provider}</span>
          <span className="rounded-[4px] bg-primary px-1.5 py-0.5 text-[10px] font-extrabold text-black">
            recommend
          </span>
          <ChevronRight className="h-4 w-4 text-muted" strokeWidth={2.5} />
        </button>
      </div>

      <KeyValueRow
        label="Rate"
        value={
          <div className="flex items-center gap-1.5">
            <span>{quote.rateLine}</span>
            <RefreshCw
              className="h-3.5 w-3.5 text-muted cursor-pointer hover:text-fg transition-colors"
              strokeWidth={2.5}
            />
          </div>
        }
      />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted font-semibold">Slippage</span>
        <button
          type="button"
          className="flex items-center gap-1 font-extrabold text-fg hover:opacity-80 transition-opacity focus:outline-none"
        >
          <span>{quote.slippageLine}</span>
          <ChevronRight className="h-4 w-4 text-muted" strokeWidth={2.5} />
        </button>
      </div>

      <KeyValueRow label="Min. received" value={quote.minReceivedLine} />

      <KeyValueRow label="Network fee" value={quote.networkFeeLine} />
    </div>
  )
}
