import React from 'react'

export function ReceiptConfirmCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-14 bg-primary text-black rounded-full font-bold flex items-center justify-center hover:bg-primary/95 transition-all text-[15px] shadow-soft active:scale-[0.98]"
    >
      Close
    </button>
  )
}
