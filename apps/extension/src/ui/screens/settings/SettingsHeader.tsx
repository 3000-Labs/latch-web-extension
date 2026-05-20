import React from 'react'
import { X } from 'lucide-react'

export function SettingsHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-12 items-center justify-between shrink-0">
      <button
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-full text-fg/70 hover:bg-surface/50 active:bg-surface/75 transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  )
}
