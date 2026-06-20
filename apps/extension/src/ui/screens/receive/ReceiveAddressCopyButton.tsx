import React, { useEffect, useRef, useState } from 'react'

import copyIconUrl from 'url:../../../../assets/home/icon-copy.svg'

import { truncateMiddle } from '../../lib/sendAddress'

export function ReceiveAddressCopyButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const displayAddress = address ? truncateMiddle(address, 9, 6) : ''

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
      disabled={!address}
      className="relative flex h-12 w-full shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[32px] border border-[#f0a300] px-5 py-3 text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={copied ? 'Address copied' : 'Copy address'}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[32px] bg-[#ffad00]"
      />
      <span className="relative whitespace-nowrap">{displayAddress}</span>
      <img src={copyIconUrl} alt="" className="relative h-4 w-4 shrink-0" aria-hidden />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
      />
    </button>
  )
}
