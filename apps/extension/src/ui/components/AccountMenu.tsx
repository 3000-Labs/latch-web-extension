import React, { useState } from 'react'
import { ChevronDown, Pencil } from 'lucide-react'

import type { StoredAccount } from '@latch/types'

import { storedAccountLabel } from '../lib/storedAccountLabel'
import { Avatar } from './Avatar'
import { CopyAddressButton } from './CopyAddressButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

function signerLabel(mode: StoredAccount['mode']): string {
  switch (mode) {
    case 'passkey':
      return 'Passkey'
    case 'mnemonic':
      return 'Seed'
    case 'freighter':
      return 'Freighter'
    case 'phantom':
      return 'Phantom'
    default:
      return 'Account'
  }
}

function shortAddr(addr?: string): string {
  if (!addr) return '—'
  return addr.length > 12 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr
}

function signerDetailLine(a: StoredAccount): string {
  const g = a.gAddress
  if (a.mode === 'freighter' || a.mode === 'mnemonic' || a.mode === 'phantom') {
    return g ? `${signerLabel(a.mode)} • ${shortAddr(g)}` : signerLabel(a.mode)
  }
  return signerLabel(a.mode)
}

export function AccountMenu({
  accountLabel,
  accounts,
  activeAccountId,
  onSelectAccount,
  onAddAccount,
  onRenameAccount,
}: {
  accountLabel: string
  accounts: StoredAccount[]
  activeAccountId?: string
  onSelectAccount: (accountId: string) => void
  onAddAccount: () => void
  onRenameAccount: (accountId: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={[
            'flex items-center gap-3 rounded-[18px] bg-surface/60 px-4 py-2 shadow-soft outline-none',
            'hover:bg-surface/70 active:bg-surface/80',
          ].join(' ')}
        >
          <Avatar name={accountLabel} size={32} />
          <span className="text-sm font-extrabold text-fg">{accountLabel}</span>
          <ChevronDown className="h-[18px] w-[18px] text-fg/70" strokeWidth={2} aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[260px]">
        {accounts.map((a, idx) => (
          <DropdownMenuItem
            key={a.id}
            onSelect={() => onSelectAccount(a.id)}
            className={activeAccountId === a.id ? 'bg-bg/40' : undefined}
          >
            <div className="flex w-full min-w-0 flex-col gap-1">
              <div className="flex w-full items-start justify-between gap-2">
                <div className="min-w-0 truncate text-sm font-extrabold text-fg">
                  {storedAccountLabel(a, idx)}
                </div>
                <button
                  type="button"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-fg/70 hover:bg-bg/50 hover:text-fg"
                  aria-label="Rename account"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onRenameAccount(a.id)
                  }}
                >
                  <Pencil className="h-[16px] w-[16px]" strokeWidth={2} aria-hidden />
                </button>
              </div>
              <div className="flex w-full items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-bold text-muted/90">
                  {shortAddr(a.smartAccountAddress)}
                </span>
                <CopyAddressButton address={a.smartAccountAddress} menuAnchor />
              </div>
              <div className="truncate text-[11px] font-bold text-muted/80">{signerDetailLine(a)}</div>
            </div>
          </DropdownMenuItem>
        ))}

        <div className="my-1 h-px w-full bg-border/60" />

        <DropdownMenuItem onSelect={onAddAccount} className="text-sm font-extrabold text-primary">
          Add account…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
