import React from 'react'

function stellarExpertTxUrl(hash: string): string {
  const net = process.env.PLASMO_PUBLIC_STELLAR_NETWORK === 'mainnet' ? 'public' : 'testnet'
  return `https://stellar.expert/explorer/${net}/tx/${encodeURIComponent(hash)}`
}

export function SendViewTransactionLink({ hash, onView }: { hash: string; onView?: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        onView?.()
        window.open(stellarExpertTxUrl(hash), '_blank', 'noopener,noreferrer')
      }}
      className="text-[12px] font-normal leading-[1.34] tracking-[-0.24px] text-[#ffad00]"
    >
      View Transaction
    </button>
  )
}
