import React, { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

const iconClass = 'h-[18px] w-[18px] shrink-0'

export function CopyAddressButton({
  address,
  className,
  /** Set when used inside Radix DropdownMenuItem so copy click does not select the row. */
  menuAnchor = false,
}: {
  address: string
  className?: string
  menuAnchor?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const disabled = !address || address === '—'

  const stopMenuSelect = menuAnchor
    ? (e: React.PointerEvent | React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
      }
    : undefined

  return (
    <button
      type="button"
      disabled={disabled}
      data-account-menu-copy={menuAnchor ? 'true' : undefined}
      onPointerDown={stopMenuSelect}
      className={[
        'shrink-0 text-primary hover:opacity-90 disabled:pointer-events-none disabled:opacity-30',
        className ?? '',
      ].join(' ')}
      aria-label={copied ? 'Copied' : 'Copy address'}
      onClick={(e) => {
        if (menuAnchor) {
          e.preventDefault()
          e.stopPropagation()
        }
        if (disabled) return
        void navigator.clipboard.writeText(address).then(() => {
          setCopied(true)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            setCopied(false)
            timeoutRef.current = null
          }, 2000)
        })
      }}
    >
      {copied ? (
        <Check className={iconClass} strokeWidth={2} aria-hidden />
      ) : (
        <Copy className={iconClass} strokeWidth={2} aria-hidden />
      )}
    </button>
  )
}
