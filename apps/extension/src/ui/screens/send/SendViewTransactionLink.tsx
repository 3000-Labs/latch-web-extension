import React from 'react'

import type { Network } from '@latch/types'

import { stellarExpertNetworkPath } from '../../lib/activeNetwork'

function stellarExpertTxUrl(hash: string, network: Network): string {
  const net = stellarExpertNetworkPath(network)
  return `https://stellar.expert/explorer/${net}/tx/${encodeURIComponent(hash)}`
}

export function SendViewTransactionLink({
  hash,
  network = 'testnet',
  onView,
}: {
  hash: string
  network?: Network
  onView?: () => void
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onView?.()
        window.open(stellarExpertTxUrl(hash, network), '_blank', 'noopener,noreferrer')
      }}
      className="text-[12px] font-normal leading-[1.34] tracking-[-0.24px] text-[#ffad00]"
    >
      View Transaction
    </button>
  )
}
