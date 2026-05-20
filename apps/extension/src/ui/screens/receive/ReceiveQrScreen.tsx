import React from 'react'
import { ReceiveQrHeader } from './ReceiveQrHeader'
import { ReceiveQrCodeCard } from './ReceiveQrCodeCard'
import { ReceiveAddressCopyButton } from './ReceiveAddressCopyButton'
import type { ReceiveToken } from './ReceiveTokenCard'

export function ReceiveQrScreen({
  token,
  onBack,
  onSimulateReceive,
}: {
  token: ReceiveToken
  onBack: () => void
  onSimulateReceive: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col animate-screenIn pb-6 justify-between">
      <div>
        <ReceiveQrHeader tokenName={token.name} onBack={onBack} />
        
        <div className="flex flex-col items-center mt-4">
          <ReceiveQrCodeCard value={token.address} logoUrl={token.iconUrl} />
          
          <h1 className="text-[26px] font-extrabold tracking-tight text-center text-fg mt-4">
            Your {token.name} Address
          </h1>
          
          <p className="text-sm text-center text-muted mt-2 leading-relaxed max-w-[280px]">
            Use this address to receive tokens <br />
            on <span className="font-extrabold text-fg">{token.name}</span>.
          </p>

          {/* Dev Simulation Button */}
          <button
            type="button"
            onClick={onSimulateReceive}
            className="mt-6 rounded-full border border-border bg-surface/40 hover:bg-surface px-4 py-1.5 text-xs font-bold text-muted hover:text-fg transition-all active:scale-95"
          >
            Simulate Incoming Tx
          </button>
        </div>
      </div>

      <div className="shrink-0 mt-8">
        <ReceiveAddressCopyButton address={token.address} />
      </div>
    </div>
  )
}
