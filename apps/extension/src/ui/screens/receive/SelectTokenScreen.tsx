import React, { useState } from 'react'
import type { SmartAccountBalanceRow } from '@latch/types'

import { SelectTokenHeader } from './SelectTokenHeader'
import { SelectTokenSearchRow } from './SelectTokenSearchRow'
import { ReceiveTokenList } from './ReceiveTokenList'
import type { ReceiveToken } from './ReceiveTokenCard'

export function SelectTokenScreen({
  smartAccountAddress,
  portfolioRows,
  portfolioLoading,
  portfolioError,
  onBack,
  onSelectToken,
}: {
  smartAccountAddress: string
  portfolioRows: SmartAccountBalanceRow[]
  portfolioLoading: boolean
  portfolioError: string | null
  onBack: () => void
  onSelectToken: (token: ReceiveToken) => void
}) {
  const [search, setSearch] = useState('')

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 animate-screenIn">
      <SelectTokenHeader onBack={onBack} />
      <SelectTokenSearchRow value={search} onChange={setSearch} />
      <div className="min-h-0 flex-1 overflow-auto">
        <ReceiveTokenList
          smartAccountAddress={smartAccountAddress}
          portfolioRows={portfolioRows}
          portfolioLoading={portfolioLoading}
          portfolioError={portfolioError}
          search={search}
          onSelect={onSelectToken}
        />
      </div>
    </div>
  )
}
