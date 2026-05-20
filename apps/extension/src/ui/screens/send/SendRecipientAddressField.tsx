import React from 'react'
import { QrCode } from 'lucide-react'

export function SendRecipientAddressField({
  value,
  onChange,
  onQrClick,
  onKeyDown,
  onBlur,
}: {
  value: string
  onChange: (next: string) => void
  onQrClick: () => void
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  onBlur?: React.FocusEventHandler<HTMLInputElement>
}) {
  return (
    <div>
      <div className="text-sm font-extrabold">Recipient Address</div>
      <div className="relative mt-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder="G... or C ..."
          className="w-full rounded-2xl border border-border bg-surface/40 py-3 pl-4 pr-12 text-sm font-bold text-fg outline-none placeholder:text-fg/40"
        />
        <button
          type="button"
          onClick={onQrClick}
          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-fg/80 hover:text-fg"
          aria-label="Scan QR code"
        >
          <QrCode className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  )
}
