import React from 'react'

import { ReceiveQrHeader } from './ReceiveQrHeader'
import { ReceiveQrCodeCard } from './ReceiveQrCodeCard'
import { ReceiveAddressCopyButton } from './ReceiveAddressCopyButton'
import type { ReceiveToken } from './ReceiveTokenCard'

export function ReceiveQrScreen({
  token,
  onBack,
}: {
  token: ReceiveToken
  onBack: () => void
  /** Dev-only: simulate an incoming transfer to preview the receipt screen. */
  onSimulateReceive?: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 animate-screenIn">
      <ReceiveQrHeader tokenName={token.name} onBack={onBack} />

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex flex-col items-center justify-center gap-5">
          <ReceiveQrCodeCard value={token.address} logoUrl={token.iconUrl} />

          <div className="flex w-full flex-col items-center gap-2 text-center">
            <h1 className="text-[26px] font-medium leading-[1.32] tracking-[-0.52px] text-[#fcfcfc]">
              Your {token.name} Address
            </h1>
            <p className="max-w-[289px] text-lg font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
              Use this address to receive tokens on{' '}
              <span className="font-bold text-[#fcfcfc]">{token.name}</span>.
            </p>
          </div>
        </div>

        <ReceiveAddressCopyButton address={token.address} />
      </div>
    </div>
  )
}
