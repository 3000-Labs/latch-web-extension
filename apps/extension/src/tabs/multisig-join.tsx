import '../style.css'

import { useEffect, useState } from 'react'

import type { GetAccountsResponse, StoredAccount } from '@latch/types'

import { friendlyError, sendToBackground } from '../ui/lib/backgroundClient'
import {
  clearMultisigJoinQueryFromLocation,
  parseMultisigJoinTokenFromLocation,
} from '../ui/lib/multisigDeepLink'
import { MultisigJoinFlow } from '../ui/multisig/MultisigJoinFlow'
import { OnboardingLayout } from '../ui/onboarding/OnboardingLayout'

export default function MultisigJoinTab() {
  const [token] = useState(() => parseMultisigJoinTokenFromLocation())
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [bootError, setBootError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    clearMultisigJoinQueryFromLocation()
  }, [])

  useEffect(() => {
    void sendToBackground<undefined, GetAccountsResponse>({
      type: 'GET_ACCOUNTS',
      payload: undefined,
    })
      .then((res) => {
        if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
        setAccounts(res.data.accounts)
      })
      .catch((e) => {
        setBootError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => setReady(true))
  }, [])

  if (!token) {
    return (
      <OnboardingLayout>
        <div className="flex w-full max-w-[400px] flex-col items-center gap-3 text-center">
          <h1 className="text-[22px] font-medium text-[#fcfcfc]">Invalid invite link</h1>
          <p className="text-sm text-[#b3b3b3]">
            This link is missing an invite token. Ask the wallet creator to share a new invite.
          </p>
        </div>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout>
      <div className="flex h-full min-h-[520px] w-full max-w-[400px] flex-col">
        {!ready ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[#b3b3b3]">
            Loading invite…
          </div>
        ) : bootError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-red-400">{bootError}</p>
          </div>
        ) : (
          <MultisigJoinFlow
            token={token}
            accounts={accounts}
            surface="popup"
            onAccountsSynced={async () => {
              const res = await sendToBackground<undefined, GetAccountsResponse>({
                type: 'GET_ACCOUNTS',
                payload: undefined,
              })
              if (res.ok && res.data) setAccounts(res.data.accounts)
            }}
          />
        )}
      </div>
    </OnboardingLayout>
  )
}
