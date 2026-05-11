import React from 'react'
import { ChevronDown } from 'lucide-react'

import type { StoredAccount } from '@latch/types'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function AccountMenu({
  name,
  accounts,
  activeAccountId,
  onSelectAccount,
}: {
  name: string
  accounts: StoredAccount[]
  activeAccountId?: string
  onSelectAccount: (accountId: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={[
            'flex items-center gap-3 rounded-[18px] bg-surface/60 px-4 py-2 shadow-soft outline-none',
            'hover:bg-surface/70 active:bg-surface/80',
          ].join(' ')}
        >
          <span className="h-[32px] w-[32px] overflow-hidden rounded-full bg-surface/80">
            <img
              alt=""
              className="h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=128&h=128&q=80"
            />
          </span>
          <span className="text-sm font-extrabold text-fg">{name}</span>
          <ChevronDown className="h-[18px] w-[18px] text-fg/70" strokeWidth={2} aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[220px]">
        {accounts.map((a, idx) => (
          <DropdownMenuItem
            key={a.id}
            onSelect={() => onSelectAccount(a.id)}
            className={activeAccountId === a.id ? 'bg-bg/40' : undefined}
          >
            {`Account ${idx + 1}`}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
