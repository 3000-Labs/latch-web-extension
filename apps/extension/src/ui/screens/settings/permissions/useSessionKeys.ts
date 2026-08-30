import { useCallback, useEffect, useState } from 'react'

import type { SessionKeyPermission } from './types'
import { sendToBackground } from '../../../../lib/backgroundClient'

export function useSessionKeys(accountId: string) {
  const [sessions, setSessions] = useState<SessionKeyPermission[]>([])
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(async () => {
    if (!accountId) return
    const res = await sendToBackground({ type: 'GET_SESSION_KEYS', payload: { accountId } })
    if (res.ok && res.data?.keys) {
      const keys = res.data.keys.map((k: any) => ({
        id: k.sessionId,
        name: k.name,
        duration: k.duration,
        spendingLimitAmount: k.spendingLimitAmount,
        spendingLimitCurrency: k.spendingLimitCurrency,
        allowed: k.allowed,
      }))
      setSessions(keys)
    } else {
      setSessions([])
    }
    setLoaded(true)
  }, [accountId])

  useEffect(() => {
    let cancelled = false
    if (!accountId) return
    void sendToBackground({ type: 'GET_SESSION_KEYS', payload: { accountId } }).then((res: any) => {
      if (cancelled) return
      if (res.ok && res.data?.keys) {
        const keys = res.data.keys.map((k: any) => ({
          id: k.sessionId,
          name: k.name,
          duration: k.duration,
          spendingLimitAmount: k.spendingLimitAmount,
          spendingLimitCurrency: k.spendingLimitCurrency,
          allowed: k.allowed,
        }))
        setSessions(keys)
      } else {
        setSessions([])
      }
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [accountId])

  const addSession = useCallback(
    async (draft: Omit<SessionKeyPermission, 'id'>) => {
      if (!accountId) throw new Error('No account ID provided')
      
      const res = await sendToBackground({
        type: 'GENERATE_SESSION_KEY',
        payload: {
          accountId,
          name: draft.name,
          duration: draft.duration,
          spendingLimitAmount: draft.spendingLimitAmount,
          spendingLimitCurrency: draft.spendingLimitCurrency,
          allowed: draft.allowed,
        },
      })
      
      if (!res.ok || !res.data) {
        throw new Error('Failed to generate session key')
      }
      
      const next: SessionKeyPermission = { ...draft, id: res.data.sessionId }
      setSessions((prev: any) => [next, ...prev])
      return next
    },
    [accountId]
  )

  const removeSession = useCallback(
    async (sessionId: string) => {
      if (!accountId) return
      const res = await sendToBackground({
        type: 'REVOKE_SESSION_KEY',
        payload: { sessionId },
      })
      if (res.ok) {
        setSessions((prev: any) => prev.filter((s: any) => s.id !== sessionId))
      }
    },
    [accountId]
  )

  return { sessions, loaded, reload, addSession, removeSession }
}
