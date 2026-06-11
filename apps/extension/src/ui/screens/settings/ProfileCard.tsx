import React, { useEffect, useRef, useState } from 'react'

import chevronRightUrl from 'url:../../../../assets/home/icon-chevron-right.svg'
import copyIconUrl from 'url:../../../../assets/home/icon-copy.svg'
import userAvatarUrl from 'url:../../../../assets/icons/user.png'

interface ProfileCardProps {
  name: string
  address: string
}

export function ProfileCard({ name, address }: ProfileCardProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shortAddress =
    address.length > 12 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address
  const disabled = !address || address === '—'

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="flex w-full items-center justify-between rounded-[14px] bg-card px-3 py-3">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[32px]">
          <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-xl font-semibold tracking-[-0.4px] text-fg">{name}</div>
          <div className="flex items-center gap-1">
            <span className="text-sm tracking-[-0.28px] text-muted">{shortAddress}</span>
            <button
              type="button"
              disabled={disabled}
              className="inline-flex h-4 w-4 items-center justify-center disabled:opacity-30"
              aria-label={copied ? 'Copied' : 'Copy address'}
              onClick={() => {
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
              <img src={copyIconUrl} alt="" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <img src={chevronRightUrl} alt="" className="h-6 w-6 shrink-0" aria-hidden />
    </div>
  )
}
