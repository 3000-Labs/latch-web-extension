import React, { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'

import type { SwapDraft, SwapQuoteVm, SwapTokenVm } from '../swap/swapVm'
import {
  swapTokens as defaultSwapTokens,
  toPositiveNumberOrNull,
  truncateAddress,
} from '../swap/swapVm'
import { ExchangeBalanceToggle } from './swap/components/ExchangeBalanceToggle'
import { ConfirmSwapAssetCard } from './swap/components/confirm/ConfirmSwapAssetCard'
import { ConfirmSwapDetailRow } from './swap/components/confirm/ConfirmSwapDetailRow'
import { ConfirmSwapFooter } from './swap/components/confirm/ConfirmSwapFooter'
import { ConfirmSwapHeader } from './swap/components/confirm/ConfirmSwapHeader'
import { ConfirmSwapQuoteSpinner } from './swap/components/confirm/ConfirmSwapQuoteSpinner'
import { ConfirmSwapSection } from './swap/components/confirm/ConfirmSwapSection'
import liquidMeshLogo from 'url:../../../assets/brand/LiquidMesh.png'

function formatReceiveAmountLine(amount: number, symbol: string) {
  const trimmed = amount
    .toFixed(8)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '')
  return `+${trimmed} ${symbol}`
}

export function ConfirmSwapScreen({
  surface,
  draft,
  quote,
  swapTokenCatalog = defaultSwapTokens,
  receiveAddress,
  onBackOrCancel,
  onConfirm,
}: {
  surface: 'popup' | 'sidepanel'
  draft: SwapDraft
  quote: SwapQuoteVm
  swapTokenCatalog?: SwapTokenVm[]
  receiveAddress?: string
  onBackOrCancel: () => void
  onConfirm: () => void
}) {
  const [mevProtection, setMevProtection] = useState(false)

  const payToken = useMemo(
    () => swapTokenCatalog.find((t) => t.id === draft.payTokenId) ?? swapTokenCatalog[0],
    [draft.payTokenId, swapTokenCatalog]
  )
  const receiveToken = useMemo(
    () => swapTokenCatalog.find((t) => t.id === draft.receiveTokenId) ?? swapTokenCatalog[1],
    [draft.receiveTokenId, swapTokenCatalog]
  )

  const payN = toPositiveNumberOrNull(draft.payAmount) ?? 0
  const gasAccount = receiveAddress?.trim() || '0x6A4A95670d95670d'
  const fromAddr = '0xb3008e9f0b2c7028d'
  const shortFromAddr = truncateAddress(fromAddr, 6, 6)
  const shortGasAddr = truncateAddress(gasAccount, 6, 6)
  const shortReceiveAddr = truncateAddress(gasAccount, 6, 6)

  const spendLine = `-${draft.payAmount || '0'} ${payToken.symbol}`
  const spendUsd = `≈$${(payN * 1.00056).toFixed(5)}`
  const receiveLine = formatReceiveAmountLine(quote.receiveAmount, receiveToken.symbol)
  const receiveUsd =
    quote.receiveUsdApproxLine.replace('≈ ', '≈') || `≈$${(payN * 1.00306).toFixed(5)} (+0.25%)`

  return (
    <div
      className={[
        'flex min-h-0 flex-1 flex-col overflow-y-auto',
        surface === 'sidepanel' ? 'pt-2' : 'pt-3',
      ].join(' ')}
    >
      <ConfirmSwapHeader onBack={onBackOrCancel} />

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-5">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <ConfirmSwapSection label="From">
              <ConfirmSwapAssetCard
                token={payToken}
                title={`Unlimited ${payToken.name}`}
                subtitle={`To: ${shortFromAddr}`}
                trailing={
                  <button
                    type="button"
                    onClick={onBackOrCancel}
                    className="text-[#b3b3b3] transition-colors hover:text-[#fcfcfc]"
                    aria-label="Edit"
                  >
                    <Pencil className="size-5" strokeWidth={2} />
                  </button>
                }
              />
            </ConfirmSwapSection>

            <ConfirmSwapSection label="Spend">
              <ConfirmSwapAssetCard
                token={payToken}
                title={spendLine}
                subtitle={spendUsd}
              />
            </ConfirmSwapSection>

            <ConfirmSwapSection label="Receive (Estimated)">
              <ConfirmSwapAssetCard
                token={receiveToken}
                title={receiveLine}
                subtitle={receiveUsd}
                trailing={<ConfirmSwapQuoteSpinner />}
              />
            </ConfirmSwapSection>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[-0.24px] text-[#b3b3b3]">MEV Protection</span>
              <ExchangeBalanceToggle checked={mevProtection} onChange={setMevProtection} />
            </div>

            <ConfirmSwapDetailRow
              label="Gas Account"
              value={shortGasAddr}
              onClick={() => {}}
              showChevron
            />

            <ConfirmSwapDetailRow
              label="Network Fee"
              value={`Fast | ${quote.networkFeeLine.replace('~ ', '')}`}
              onClick={() => {}}
              showChevron
            />

            <ConfirmSwapDetailRow label="Min. Received" value={quote.minReceivedLine.trim()} />

            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[-0.24px] text-[#b3b3b3]">Provider</span>
              <div className="flex items-center gap-1.5">
                <img
                  src={liquidMeshLogo}
                  alt=""
                  className="h-6 w-[25px] shrink-0 rounded object-cover"
                />
                <span className="text-xs font-medium tracking-[-0.12px] text-[#fcfcfc]">
                  {quote.provider}
                </span>
              </div>
            </div>

            <ConfirmSwapDetailRow label="Receive Address" value={shortReceiveAddr} />
          </div>
        </div>

        <ConfirmSwapFooter onCancel={onBackOrCancel} onConfirm={onConfirm} />
      </div>
    </div>
  )
}
