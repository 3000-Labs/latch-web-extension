import React from 'react'

export function SendTryAgainButton({ onTryAgain }: { onTryAgain: () => void }) {
  return (
    <button
      type="button"
      onClick={onTryAgain}
      className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
    >
      Try Again
    </button>
  )
}
