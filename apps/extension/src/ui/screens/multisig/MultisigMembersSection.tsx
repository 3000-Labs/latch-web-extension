import React from 'react'

import type { MultisigDraftMember } from '@latch/types'

import myProfileIconUrl from 'url:../../../../assets/home/settings-my-profile.svg'
import biometricsIconUrl from 'url:../../../../assets/icons/biometrics.svg'

import { memberDisplayAddress, memberTypeLabel } from '../../lib/multisigMembers'

export function MultisigMemberRow({
  member,
  badge,
  onRemove,
}: {
  member: MultisigDraftMember
  badge?: string
  onRemove?: () => void
}) {
  const label = member.label ?? 'Owner'
  const address = memberDisplayAddress(member)
  const typeLabel = badge ?? memberTypeLabel(member.memberType)
  const iconUrl = member.memberType === 'passkey' ? biometricsIconUrl : myProfileIconUrl

  return (
    <div className="flex w-full items-center gap-2 rounded-[14px] bg-[#2a2928] p-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#1e1e1e] p-1">
          <img src={iconUrl} alt="" className="h-5 w-5 object-contain" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
              {label}
            </span>
            <span
              className={[
                'shrink-0 rounded-lg px-2 py-1 text-xs font-medium',
                badge === 'You'
                  ? 'bg-[rgba(255,173,0,0.08)] text-primary'
                  : 'bg-[rgba(62,233,107,0.08)] text-[#3ee96b]',
              ].join(' ')}
            >
              {typeLabel}
            </span>
          </div>
          {address ? (
            <span className="truncate font-mono text-xs text-[#b3b3b3]">{address}</span>
          ) : null}
        </div>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-xs font-medium text-[#b3b3b3] hover:text-[#fcfcfc]"
        >
          Remove
        </button>
      ) : null}
    </div>
  )
}

export function MultisigMembersSection({
  title,
  members,
  emptyLabel,
  youMemberId,
  onRemoveMember,
}: {
  title: string
  members: MultisigDraftMember[]
  emptyLabel?: string
  youMemberId?: string
  onRemoveMember?: (memberId: string) => void
}) {
  return (
    <section className="flex w-full flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#b3b3b3]">{title}</h2>
      {members.length === 0 ? (
        <p className="rounded-[14px] bg-[#2a2928] p-4 text-sm text-[#b3b3b3]">
          {emptyLabel ?? 'No owners added yet.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <MultisigMemberRow
              key={member.id}
              member={member}
              badge={youMemberId && member.id === youMemberId ? 'You' : undefined}
              onRemove={onRemoveMember ? () => onRemoveMember(member.id) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  )
}
