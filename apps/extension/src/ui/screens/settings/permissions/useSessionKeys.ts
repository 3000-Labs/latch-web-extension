import { useCallback, useEffect, useState } from 'react'

import type { SessionKeyPermission } from './types'

const STORAGE_KEY = 'latch.sessionKeys'

function isSessionKeyPermission(v: unknown): v is SessionKeyPermission {
  if (typeof v !== 'object' || v == null) return false
  const o = v as SessionKeyPermission
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.duration === 'string' &&
    typeof o.spendingLimitAmount === 'string' &&
    o.spendingLimitCurrency === 'USDC' &&
    Array.isArray(o.allowed) &&
    o.allowed.every((x) => typeof x === 'string')
  )
}

export function useSessionKeys() {
  const [sessions, setSessions] = useState<SessionKeyPermission[]>([])
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(async () => {
    const res = await chrome.storage.local.get([STORAGE_KEY])
    const raw = res[STORAGE_KEY]
    if (Array.isArray(raw)) {
      setSessions(raw.filter(isSessionKeyPermission))
    } else {
      setSessions([])
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    void chrome.storage.local.get([STORAGE_KEY]).then((res) => {
      if (cancelled) return
      const raw = res[STORAGE_KEY]
      if (Array.isArray(raw)) setSessions(raw.filter(isSessionKeyPermission))
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback(async (next: SessionKeyPermission[]) => {
    setSessions(next)
    await chrome.storage.local.set({ [STORAGE_KEY]: next })
  }, [])

  const addSession = useCallback(
    async (draft: Omit<SessionKeyPermission, 'id'>) => {
      const next: SessionKeyPermission = { ...draft, id: crypto.randomUUID() }
      await persist([next, ...sessions])
      return next
    },
    [persist, sessions]
  )

  return { sessions, loaded, reload, addSession }
}

