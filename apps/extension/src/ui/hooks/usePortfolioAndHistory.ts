import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  GetSmartAccountBalancesRequest,
  GetSmartAccountBalancesResponse,
  GetSmartAccountTransactionsRequest,
  GetSmartAccountTransactionsResponse,
  GetSetupStateResponse,
  SmartAccountBalanceRow,
  StoredAccount,
} from '@latch/types'

import {
  groupHistoryItems,
  iconUrlForCode,
  mapTransactionToHistoryItem,
} from '../lib/historyFormat'
import { cancelBackgroundRequest, sendToBackground } from '../lib/backgroundClient'
import type { HistorySectionVm } from '../types/history'
import type { Page, Route } from '../routing/routes'

/** Generate a unique id for each request so the background can key an AbortController. */
function newRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function usePortfolioAndHistory({
  accounts,
  activeAccountId,
  activeNetwork,
  route,
  page,
  needsMnemonicUnlock,
  setupState,
  accountsHydrated,
  accountsLoadSucceeded,
}: {
  accounts: StoredAccount[]
  activeAccountId: string | undefined
  activeNetwork: 'testnet' | 'mainnet'
  route: Route
  page: Page
  needsMnemonicUnlock: boolean
  setupState: GetSetupStateResponse['setupState']
  accountsHydrated: boolean
  accountsLoadSucceeded: boolean
}) {
  const [portfolioRows, setPortfolioRows] = useState<SmartAccountBalanceRow[]>([])
  const [totalBalanceUsd, setTotalBalanceUsd] = useState<string | null>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioHydrated, setPortfolioHydrated] = useState(false)
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const [historySections, setHistorySections] = useState<HistorySectionVm[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const portfolioRowsRef = useRef(portfolioRows)
  portfolioRowsRef.current = portfolioRows
  const portfolioHydratedRef = useRef(false)

  // Track the most-recent in-flight requestId for each resource so we can
  // cancel the previous one when a new request supersedes it.
  const portfolioRequestIdRef = useRef<string | null>(null)
  const historyRequestIdRef = useRef<string | null>(null)

  const recentActivityItems = useMemo(
    () => historySections.flatMap((section) => section.items),
    [historySections]
  )

  useEffect(() => {
    // Cancel any in-flight portfolio/history requests for the previous account.
    if (portfolioRequestIdRef.current) {
      cancelBackgroundRequest(portfolioRequestIdRef.current)
      portfolioRequestIdRef.current = null
    }
    if (historyRequestIdRef.current) {
      cancelBackgroundRequest(historyRequestIdRef.current)
      historyRequestIdRef.current = null
    }

    portfolioHydratedRef.current = false
    setPortfolioHydrated(false)
    setPortfolioRows([])
    setTotalBalanceUsd(null)
    setHistorySections([])
    setPortfolioError(null)
    setHistoryError(null)
    // Do not clear portfolioLoading/historyLoading here — in-flight fetches still
    // own those flags and will clear them in finally.
  }, [activeAccountId])

  // Cancel in-flight requests on unmount.
  useEffect(() => {
    return () => {
      if (portfolioRequestIdRef.current) {
        cancelBackgroundRequest(portfolioRequestIdRef.current)
        portfolioRequestIdRef.current = null
      }
      if (historyRequestIdRef.current) {
        cancelBackgroundRequest(historyRequestIdRef.current)
        historyRequestIdRef.current = null
      }
    }
  }, [])

  // Network switch: drop stale history rows. Skip the initial mount so we don't
  // race GET_ACTIVE_NETWORK and leave hydrated=false with no refetch started.
  const prevNetworkForHistoryRef = useRef<'testnet' | 'mainnet' | null>(null)
  useEffect(() => {
    const prev = prevNetworkForHistoryRef.current
    prevNetworkForHistoryRef.current = activeNetwork
    if (prev === null || prev === activeNetwork) return
    setHistorySections([])
    setHistoryError(null)
  }, [activeNetwork])

  const loadHistory = useCallback(
    async (opts?: { force?: boolean }) => {
      const acc = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
      if (!acc?.id) {
        setHistorySections([])
        setHistoryLoading(false)
        return
      }

      // Cancel any in-flight history request before starting a new one.
      if (historyRequestIdRef.current) {
        cancelBackgroundRequest(historyRequestIdRef.current)
      }
      const requestId = newRequestId('history')
      historyRequestIdRef.current = requestId

      setHistoryLoading(true)
      setHistoryError(null)
      try {
        const res = await sendToBackground<
          GetSmartAccountTransactionsRequest,
          GetSmartAccountTransactionsResponse
        >({
          type: 'GET_SMART_ACCOUNT_TRANSACTIONS',
          payload: { accountId: acc.id, force: opts?.force === true, requestId },
        })

        // Guard against a response arriving after the request was superseded.
        if (historyRequestIdRef.current !== requestId) return

        if (!res.ok) {
          setHistoryError(res.error?.message ?? 'Could not load transactions')
          setHistorySections([])
          return
        }
        const items = (res.data?.items ?? []).map((row) =>
          mapTransactionToHistoryItem(row, iconUrlForCode(portfolioRowsRef.current, row.assetCode))
        )
        setHistorySections(groupHistoryItems(items))
      } finally {
        if (historyRequestIdRef.current === requestId) {
          historyRequestIdRef.current = null
          setHistoryLoading(false)
        }
      }
    },
    [accounts, activeAccountId]
  )

  const loadPortfolio = useCallback(async () => {
    const acc = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
    if (!acc?.id || !acc.smartAccountAddress?.trim()) {
      setPortfolioRows([])
      setPortfolioError(null)
      portfolioHydratedRef.current = true
      setPortfolioHydrated(true)
      return
    }

    // Cancel any in-flight portfolio request before starting a new one.
    if (portfolioRequestIdRef.current) {
      cancelBackgroundRequest(portfolioRequestIdRef.current)
    }
    const requestId = newRequestId('portfolio')
    portfolioRequestIdRef.current = requestId

    const showLoading = !portfolioHydratedRef.current
    if (showLoading) setPortfolioLoading(true)
    setPortfolioError(null)
    try {
      const res = await sendToBackground<
        GetSmartAccountBalancesRequest,
        GetSmartAccountBalancesResponse
      >({
        type: 'GET_SMART_ACCOUNT_BALANCES',
        payload: { accountId: acc.id, requestId },
      })

      // Guard against a response arriving after the request was superseded.
      if (portfolioRequestIdRef.current !== requestId) return

      if (!res.ok) {
        setPortfolioError(res.error?.message ?? 'Could not load balances')
        setPortfolioRows([])
        return
      }
      setPortfolioRows(res.data?.rows ?? [])
      setTotalBalanceUsd(res.data?.totalBalanceUsd ?? null)
    } finally {
      if (portfolioRequestIdRef.current === requestId) {
        portfolioRequestIdRef.current = null
        setPortfolioLoading(false)
        portfolioHydratedRef.current = true
        setPortfolioHydrated(true)
      }
    }
  }, [accounts, activeAccountId])

  useEffect(() => {
    if (page !== 'main' && page !== 'settings') return
    if (route !== 'home') return
    if (needsMnemonicUnlock) return

    // Avoid relying on `setupState` for this: on cold start we can render the Home route
    // before `setupState` finishes hydrating, which would prevent balances from fetching.
    const acc = accounts.find((a) => a.id === activeAccountId) ?? accounts[0]
    if (!acc?.smartAccountAddress?.trim()) {
      // Network switch / empty bucket: don't leave HomeLoadingOverlay stuck on "Loading..."
      portfolioHydratedRef.current = true
      setPortfolioHydrated(true)
      setPortfolioLoading(false)
      setPortfolioRows([])
      setTotalBalanceUsd(null)
      setPortfolioError(null)
      return
    }

    void loadPortfolio()
  }, [page, route, needsMnemonicUnlock, accounts, activeAccountId, loadPortfolio])

  const portfolioRetryAttemptRef = useRef(0)
  useEffect(() => {
    if (route !== 'home' || (page !== 'main' && page !== 'settings')) {
      portfolioRetryAttemptRef.current = 0
      return
    }
    if (!portfolioError) {
      portfolioRetryAttemptRef.current = 0
      return
    }
    const attempt = Math.min(portfolioRetryAttemptRef.current, 5)
    const backoffMs = [750, 1500, 3000, 5000, 8000, 12000][attempt] ?? 12000
    portfolioRetryAttemptRef.current = attempt + 1
    const t = setTimeout(() => {
      void loadPortfolio()
    }, backoffMs)
    return () => clearTimeout(t)
  }, [route, setupState, page, portfolioError, loadPortfolio])

  useEffect(() => {
    if (!accountsHydrated || !accountsLoadSucceeded) return
    if (route !== 'history' && route !== 'home') return
    void loadHistory()
  }, [route, loadHistory, activeNetwork, accountsHydrated, accountsLoadSucceeded])

  return {
    portfolioRows,
    totalBalanceUsd,
    portfolioLoading,
    portfolioHydrated,
    portfolioError,
    historySections,
    historyLoading,
    historyError,
    recentActivityItems,
    loadHistory,
    loadPortfolio,
  }
}
