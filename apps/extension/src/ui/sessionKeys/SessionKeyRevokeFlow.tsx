import React, { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { BaseLayout } from '../components/BaseLayout'
import { Button } from '../components/Button'
import { IconButton } from '../components/IconButton'
import { Trash2 } from 'lucide-react'

interface SessionKeyInfo {
  accountId: string
  rawPublicKey: Uint8Array
  createdAt: number
}

export function SessionKeyRevokeFlow({
  accountId,
  onBack,
}: {
  accountId: string
  onBack: () => void
}) {
  const [sessions, setSessions] = useState<SessionKeyInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSessions() {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'GET_SESSION_KEYS',
          payload: { accountId },
        })
        if (response.ok && response.data?.keys) {
          setSessions(response.data.keys)
        }
      } catch (e) {
        console.error('Failed to load sessions', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadSessions()
  }, [accountId])

  const handleRevoke = async (sessionAccountId: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REVOKE_SESSION_KEY',
        payload: { accountId: sessionAccountId },
      })
      if (!response.ok) throw new Error('Revoke failed')
      setSessions(sessions.filter((s) => s.accountId !== sessionAccountId))
      // TODO: send remove_context_rule transaction if not expired
    } catch (e) {
      console.error(e)
      alert('Failed to revoke session key.')
    }
  }

  return (
    <BaseLayout>
      <Header title="Manage Sessions" onBack={onBack} />
      <div className="flex flex-col flex-1 p-4 space-y-4 text-white overflow-y-auto">
        <p className="text-sm text-neutral-400">
          Active session keys authorize limited actions without your passkey. Revoke them anytime to secure your account immediately.
        </p>

        {isLoading ? (
          <div className="flex justify-center p-8 text-neutral-500">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center border-2 border-dashed border-[#2B2A29] rounded-xl bg-[#090909]">
            <p className="text-neutral-500">No active session keys found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div 
                key={session.accountId}
                className="flex items-center justify-between p-4 bg-[#2B2A29] rounded-xl border border-[#3B3A39]"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">Session Key</span>
                  <span className="text-xs text-neutral-400">
                    Created: {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <IconButton 
                  icon={<Trash2 size={18} className="text-red-400" />}
                  onClick={() => handleRevoke(session.accountId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
