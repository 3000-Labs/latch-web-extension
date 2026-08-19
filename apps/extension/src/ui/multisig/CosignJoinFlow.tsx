import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { StoredAccount } from '@latch/types'

import { apiDiscoverMemberships, apiGetTransportPubkey, apiPostJoinRelay } from '../lib/cosignFlow'
import { ensureCosignV1Auth } from '../lib/cosignV1Auth'
import {
  enrollNewPasskeyForCosignWizard,
  listReusablePasskeyAccounts,
} from '../lib/multisigPasskey'
import { JoinMultisigScreen } from '../screens/multisig/JoinMultisigScreen'

export function CosignJoinFlow({
  token,
  accounts,
  surface,
  onJoined,
  onAccountsSynced,
  onBack,
}: {
  token: string
  accounts: StoredAccount[]
  surface: 'popup' | 'sidepanel'
  onJoined?: () => void
  onAccountsSynced?: () => void | Promise<void>
  onBack?: () => void
}) {
  const [joinBusy, setJoinBusy] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [localAccounts, setLocalAccounts] = useState(accounts)

  useEffect(() => {
    setLocalAccounts(accounts)
  }, [accounts])

  const passkeyOptions = useMemo(() => listReusablePasskeyAccounts(localAccounts), [localAccounts])
  const [selectedPasskeyAccountId, setSelectedPasskeyAccountId] = useState<string | undefined>()

  useEffect(() => {
    if (passkeyOptions.length === 0) {
      setSelectedPasskeyAccountId(undefined)
      return
    }
    setSelectedPasskeyAccountId((prev) =>
      prev && passkeyOptions.some((a) => a.id === prev) ? prev : passkeyOptions[0]!.id
    )
  }, [passkeyOptions])

  const selectedPasskey = useMemo(
    () => passkeyOptions.find((a) => a.id === selectedPasskeyAccountId),
    [passkeyOptions, selectedPasskeyAccountId]
  )

  const runJoin = useCallback(
    async (linked: StoredAccount) => {
      if (linked.mode !== 'passkey') {
        setJoinError('Join with a passkey account — cosign V1 auth requires a passkey wallet.')
        return
      }
      const credentialId = linked.passkeyCredentialId?.trim()
      if (!credentialId) {
        setJoinError('Selected passkey account is missing credential data.')
        return
      }

      setJoinBusy(true)
      setJoinError(null)
      try {
        await ensureCosignV1Auth({
          linkedAccountId: linked.id,
          passkeyCredentialId: credentialId,
          surface,
        })
        const transportPubkeyB64 = await apiGetTransportPubkey()
        await apiPostJoinRelay({
          inviteToken: token,
          linkedAccountId: linked.id,
          memberBlindId: '',
          transportPubkeyB64,
        })
        setWaiting(true)
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => setTimeout(r, 3000))
          const discovered = await apiDiscoverMemberships(linked.id)
          if (
            discovered.discovered.length > 0 ||
            discovered.accounts.some((a) => a.mode === 'multisig')
          ) {
            await onAccountsSynced?.()
            onJoined?.()
            return
          }
        }
        setJoinError('Still waiting for wallet owner to complete setup. Try again later.')
      } catch (e) {
        setJoinError(e instanceof Error ? e.message : String(e))
      } finally {
        setJoinBusy(false)
      }
    },
    [token, surface, onAccountsSynced, onJoined]
  )

  const joinWithSelectedPasskey = useCallback(() => {
    if (!selectedPasskey) {
      setJoinError('Choose a passkey account to continue.')
      return
    }
    void runJoin(selectedPasskey)
  }, [selectedPasskey, runJoin])

  const joinWithNewPasskey = useCallback(async () => {
    setJoinBusy(true)
    setJoinError(null)
    try {
      const account = await enrollNewPasskeyForCosignWizard({
        accounts: localAccounts,
        label: 'Shared wallet',
        surface,
      })
      const nextAccounts = [...localAccounts.filter((a) => a.id !== account.id), account]
      setLocalAccounts(nextAccounts)
      setSelectedPasskeyAccountId(account.id)
      await onAccountsSynced?.()
      await runJoin(account)
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : String(e))
      setJoinBusy(false)
    }
  }, [localAccounts, surface, onAccountsSynced, runJoin])

  return (
    <JoinMultisigScreen
      flowVariant="cosign"
      waiting={waiting}
      preview={
        waiting
          ? {
              draft: { id: 'cosign-waiting', walletName: 'Waiting for owner' },
              members: [],
            }
          : {
              draft: { id: 'cosign-join', walletName: 'Join shared wallet' },
              members: [],
            }
      }
      previewLoading={false}
      previewError={joinError}
      joinBusy={joinBusy}
      joinError={joinError}
      passkeyOptions={passkeyOptions.map((a) => ({
        accountId: a.id,
        label: a.label ?? 'Passkey',
      }))}
      selectedPasskeyAccountId={selectedPasskeyAccountId}
      onSelectPasskeyAccountId={setSelectedPasskeyAccountId}
      canReusePasskey={passkeyOptions.length > 0}
      onJoinWithExistingPasskey={joinWithSelectedPasskey}
      onJoinWithNewPasskey={() => void joinWithNewPasskey()}
      onBack={onBack ?? (() => {})}
      hideBack={!onBack}
    />
  )
}
