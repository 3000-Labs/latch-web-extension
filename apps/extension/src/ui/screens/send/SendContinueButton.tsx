import React from 'react'

export function SendContinueButton({ onContinue }: { onContinue: () => void }) {
  return (
    <button
      type="button"
      onClick={onContinue}
      className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
    >
      Continue
    </button>
  )
}
