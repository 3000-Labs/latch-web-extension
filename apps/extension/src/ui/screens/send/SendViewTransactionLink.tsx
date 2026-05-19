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
      className="mt-6 text-sm font-extrabold text-primary hover:underline"
    >
      View Transaction
    </button>
  )
}
