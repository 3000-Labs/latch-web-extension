import React, { useMemo, useState } from 'react'

import { CreateSessionKeyScreen } from './CreateSessionKeyScreen'
import { PermissionsScreen } from './PermissionsScreen'
import { ReviewConfirmScreen } from './ReviewConfirmScreen'
import { SessionCreatedScreen } from './SessionCreatedScreen'
import { SessionNotCreatedScreen } from './SessionNotCreatedScreen'
import { SetLimitsScreen } from './SetLimitsScreen'
import type { SessionKeyDraft } from './permissions/types'
import { useSessionKeys } from './permissions/useSessionKeys'

type PermissionsView = 'list' | 'createSessionKey' | 'setLimits' | 'review' | 'success' | 'failure'

export function PermissionsFlow({ onBackToSettings }: { onBackToSettings: () => void }) {
  const [view, setView] = useState<PermissionsView>('list')
  const { sessions, addSession } = useSessionKeys()
  const [draft, setDraft] = useState<SessionKeyDraft | null>(null)

  const safeDraft = useMemo<SessionKeyDraft>(() => {
    return (
      draft ?? {
        name: '',
        duration: '1 Hour',
        spendingLimitAmount: '0.00',
        spendingLimitCurrency: 'USDC',
        allowed: [],
      }
    )
  }, [draft])

  if (view === 'success') {
    return (
      <SessionCreatedScreen
        draft={safeDraft}
        onBack={() => setView('list')}
        onContinue={() => setView('list')}
      />
    )
  }

  if (view === 'failure') {
    return (
      <SessionNotCreatedScreen
        draft={safeDraft}
        onBack={() => setView('review')}
        onTryAgain={() => setView('review')}
      />
    )
  }

  if (view === 'review') {
    return (
      <ReviewConfirmScreen
        draft={safeDraft}
        onBack={() => setView('setLimits')}
        onConfirm={() => {
          // For now, creation is local-only (no backend). If this starts failing later,
          // we’ll route to the failure screen.
          void addSession(safeDraft).then(() => setView('success'))
        }}
      />
    )
  }

  if (view === 'setLimits') {
    return (
      <SetLimitsScreen
        onBack={() => setView('createSessionKey')}
        onContinue={(res) => {
          setDraft((d) => ({
            name: d?.name ?? '',
            duration: res.duration,
            spendingLimitAmount: res.spendingLimitAmount,
            spendingLimitCurrency: res.spendingLimitCurrency,
            allowed: res.allowed,
          }))
          setView('review')
        }}
      />
    )
  }

  if (view === 'createSessionKey') {
    return (
      <CreateSessionKeyScreen
        onBack={() => setView('list')}
        onContinue={(sessionName) => {
          setDraft({
            name: sessionName,
            duration: '1 Hour',
            spendingLimitAmount: '0.00',
            spendingLimitCurrency: 'USDC',
            allowed: [],
          })
          setView('setLimits')
        }}
      />
    )
  }

  return (
    <PermissionsScreen
      sessions={sessions}
      onBack={onBackToSettings}
      onAdd={() => setView('createSessionKey')}
    />
  )
}

