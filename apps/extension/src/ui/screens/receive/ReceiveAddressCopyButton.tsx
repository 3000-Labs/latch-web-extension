import React, { useState, useEffect, useRef } from 'react'
import { Copy, Check } from 'lucide-react'

export function ReceiveAddressCopyButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const displayAddress = address
    ? `${address.slice(0, 9)}...${address.slice(-6)}`
    : ''

  const handleCopy = () => {
    if (!address) return
    void navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setCopied(false)
        timeoutRef.current = null
      }, 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full h-14 bg-primary text-black rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary/95 transition-all text-[15px] px-6 shadow-soft active:scale-[0.98]"
      aria-label={copied ? 'Address copied' : 'Copy address'}
    >
      <span>{copied ? 'Address Copied!' : displayAddress}</span>
      {copied ? (
        <Check className="h-5 w-5 shrink-0" strokeWidth={2.5} />
      ) : (
        <Copy className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
      )}
    </button>
  )
}
