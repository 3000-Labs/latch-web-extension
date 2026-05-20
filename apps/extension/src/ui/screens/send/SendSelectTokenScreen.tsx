import React, { useState } from 'react'

import type { SmartAccountBalanceRow } from '@latch/types'

import { SendSelectTokenHeader } from './SendSelectTokenHeader'
import { SendSelectTokenSearchRow } from './SendSelectTokenSearchRow'
import { SendTokenList } from './SendTokenList'

export function SendSelectTokenScreen({
  tokens,
  loading,
  error,
  onBack,
  onSelectToken,
}: {
  tokens: SmartAccountBalanceRow[]
  loading: boolean
  error: string | null
  onBack: () => void
  onSelectToken: (token: SmartAccountBalanceRow) => void
}) {
  const [search, setSearch] = useState('')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SendSelectTokenHeader onBack={onBack} />
      <div className="mt-4 shrink-0">
        <SendSelectTokenSearchRow value={search} onChange={setSearch} />
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-auto">
        <SendTokenList
          tokens={tokens}
          search={search}
          loading={loading}
          error={error}
          onSelect={onSelectToken}
        />
      </div>
    </div>
  )
}
