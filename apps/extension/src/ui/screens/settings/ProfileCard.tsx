import React from 'react'
import { CopyAddressButton } from '../../components/CopyAddressButton'
import userAvatar from 'url:../../../../assets/icons/user.png'

interface ProfileCardProps {
  name: string
  address: string
  onCopyAddress?: () => void
}

export function ProfileCard({ name, address }: ProfileCardProps) {
  const shortAddress =
    address.length > 12 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-[28px] border border-border/40 bg-surface px-4 py-6 text-center">
      <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full border border-border/30 shadow-md">
        <img src={userAvatar} className="h-full w-full object-cover" alt="Profile Avatar" />
      </div>

      <div className="mt-3 text-base font-extrabold text-fg">{name}</div>

      <div className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted tracking-wider uppercase">
        <span>{shortAddress}</span>
        <CopyAddressButton
          address={address}
          className="text-muted hover:text-fg transition-colors"
        />
      </div>
    </div>
  )
}
