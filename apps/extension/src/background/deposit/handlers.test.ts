import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DepositIntent, StoredAccount } from '@latch/types'

const getAccounts = vi.fn()
const getActiveNetwork = vi.fn(async () => 'testnet' as const)
const resolveAccessToken = vi.fn()
const createDepositIntent = vi.fn()
const fetchDepositIntentStatus = vi.fn()
const openMoonPayBuyTab = vi.fn()
const openTransakBuyTab = vi.fn()

vi.mock('../storage', () => ({
  getAccounts: () => getAccounts(),
}))

vi.mock('../network/config', () => ({
  getActiveNetwork: () => getActiveNetwork(),
}))

vi.mock('../api/v1Client', () => ({
  resolveAccessToken: (...args: unknown[]) => resolveAccessToken(...args),
}))

vi.mock('../api/deposit', () => ({
  createDepositIntent: (...args: unknown[]) => createDepositIntent(...args),
  fetchDepositIntentStatus: (...args: unknown[]) => fetchDepositIntentStatus(...args),
}))

vi.mock('../../lib/moonpayBuyUrl', () => ({
  openMoonPayBuyTab: (...args: unknown[]) => openMoonPayBuyTab(...args),
}))

vi.mock('../../lib/transakBuyUrl', () => ({
  openTransakBuyTab: (...args: unknown[]) => openTransakBuyTab(...args),
}))

vi.mock('../cosign/v1AuthWallet', () => ({
  v1AuthWalletForLinkedAccount: (linked: StoredAccount) => ({
    wallet: linked.smartAccountAddress?.trim() || linked.gAddress?.trim() || '',
    keyType: linked.mode === 'passkey' ? ('passkey' as const) : ('ed25519' as const),
  }),
}))

import { BackendError } from '../api/client'
import { assertDepositIntent, tryHandleDepositMessage } from './handlers'

function passkeyAccount(overrides: Partial<StoredAccount> = {}): StoredAccount {
  return {
    id: 'acc-1',
    mode: 'passkey',
    smartAccountAddress: 'CABC123',
    passkeyCredentialId: 'cred',
    createdAt: 0,
    ...overrides,
  }
}

describe('assertDepositIntent', () => {
  it('preserves signed widget URLs', () => {
    const intent = assertDepositIntent({
      intent_id: 'i1',
      memo_id: '99',
      pool_address: 'GPOOL',
      expires_at: '2026-01-01T00:00:00Z',
      widget_url: 'https://buy.moonpay.com?apiKey=x&signature=sig',
    })
    expect(intent.widget_url).toContain('signature=sig')
    expect(intent.widgetUrl).toContain('signature=sig')
  })

  it('rejects malformed intents', () => {
    expect(() =>
      assertDepositIntent({
        intent_id: '',
        memo_id: '1',
        pool_address: 'G',
        expires_at: '',
      })
    ).toThrow(/missing memo_id/)
  })
})

describe('tryHandleDepositMessage', () => {
  beforeEach(() => {
    getAccounts.mockReset()
    getActiveNetwork.mockResolvedValue('testnet')
    resolveAccessToken.mockResolvedValue('tok')
    createDepositIntent.mockReset()
    openMoonPayBuyTab.mockReset()
    openMoonPayBuyTab.mockResolvedValue(undefined)
    openTransakBuyTab.mockReset()
    openTransakBuyTab.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects unknown accounts', async () => {
    getAccounts.mockResolvedValue({ accounts: [], activeAccountId: undefined })
    await expect(
      tryHandleDepositMessage(
        { type: 'CREATE_DEPOSIT_INTENT', payload: { accountId: 'missing' } },
        vi.fn(),
        (data) => ({ ok: true, data })
      )
    ).rejects.toMatchObject({ code: 'no_account' } satisfies Partial<BackendError>)
  })

  it('rejects multisig accounts', async () => {
    getAccounts.mockResolvedValue({
      accounts: [passkeyAccount({ mode: 'multisig', smartAccountAddress: 'CMULTI' })],
      activeAccountId: 'acc-1',
    })
    await expect(
      tryHandleDepositMessage(
        { type: 'CREATE_DEPOSIT_INTENT', payload: { accountId: 'acc-1' } },
        vi.fn(),
        (data) => ({ ok: true, data })
      )
    ).rejects.toMatchObject({ code: 'fund_unsupported_mode' } satisfies Partial<BackendError>)
  })

  it('rejects accounts missing a smart account address', async () => {
    getAccounts.mockResolvedValue({
      accounts: [passkeyAccount({ smartAccountAddress: undefined })],
      activeAccountId: 'acc-1',
    })
    await expect(
      tryHandleDepositMessage(
        { type: 'CREATE_DEPOSIT_INTENT', payload: { accountId: 'acc-1' } },
        vi.fn(),
        (data) => ({ ok: true, data })
      )
    ).rejects.toMatchObject({ code: 'no_smart_account' } satisfies Partial<BackendError>)
  })

  it('prefers a backend signed widget URL when opening MoonPay', async () => {
    getAccounts.mockResolvedValue({
      accounts: [passkeyAccount()],
      activeAccountId: 'acc-1',
    })
    const intent: DepositIntent = {
      intent_id: 'i1',
      memo_id: '12345',
      pool_address: 'GPOOL',
      expires_at: '2026-01-01T00:00:00Z',
      widgetUrl: 'https://buy.moonpay.com?apiKey=pk_live_x&signature=abc',
    }
    createDepositIntent.mockResolvedValue(intent)

    const sendResponse = vi.fn()
    await tryHandleDepositMessage(
      {
        type: 'CREATE_DEPOSIT_INTENT',
        payload: { accountId: 'acc-1', openMoonPay: true },
      },
      sendResponse,
      (data) => ({ ok: true, data })
    )

    expect(openMoonPayBuyTab).toHaveBeenCalledWith(
      expect.objectContaining({
        widgetUrl: 'https://buy.moonpay.com?apiKey=pk_live_x&signature=abc',
        network: 'testnet',
        poolAddress: 'GPOOL',
        memoId: '12345',
      })
    )
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: expect.objectContaining({ memo_id: '12345' }),
    })
  })

  it('maps unsigned live MoonPay failures to moonpay_unsigned_url', async () => {
    getAccounts.mockResolvedValue({
      accounts: [passkeyAccount()],
      activeAccountId: 'acc-1',
    })
    createDepositIntent.mockResolvedValue({
      intent_id: 'i1',
      memo_id: '12345',
      pool_address: 'GPOOL',
      expires_at: '2026-01-01T00:00:00Z',
    })
    openMoonPayBuyTab.mockRejectedValue(
      new Error(
        'MoonPay live URLs with walletAddress require a server-signed signature (missing widget_url)'
      )
    )

    await expect(
      tryHandleDepositMessage(
        {
          type: 'CREATE_DEPOSIT_INTENT',
          payload: { accountId: 'acc-1', openMoonPay: true },
        },
        vi.fn(),
        (data) => ({ ok: true, data })
      )
    ).rejects.toMatchObject({ code: 'moonpay_unsigned_url' } satisfies Partial<BackendError>)
  })

  it('opens Transak with backend widget_url and forwards provider options', async () => {
    getAccounts.mockResolvedValue({
      accounts: [passkeyAccount()],
      activeAccountId: 'acc-1',
    })
    const intent: DepositIntent = {
      intent_id: 'i1',
      memo_id: '12345',
      pool_address: 'GPOOL',
      expires_at: '2026-01-01T00:00:00Z',
      widget_url: 'https://global-stg.transak.com?sessionId=abc',
    }
    createDepositIntent.mockResolvedValue(intent)

    const sendResponse = vi.fn()
    await tryHandleDepositMessage(
      {
        type: 'CREATE_DEPOSIT_INTENT',
        payload: { accountId: 'acc-1', openTransak: true, cryptoCurrency: 'USDC' },
      },
      sendResponse,
      (data) => ({ ok: true, data })
    )

    expect(createDepositIntent).toHaveBeenCalledWith('CABC123', 'CABC123', {
      provider: 'transak',
      cryptoCurrency: 'USDC',
    })
    expect(openTransakBuyTab).toHaveBeenCalledWith({
      widgetUrl: 'https://global-stg.transak.com?sessionId=abc',
    })
    expect(openMoonPayBuyTab).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: expect.objectContaining({ memo_id: '12345' }),
    })
  })

  it('rejects Transak when widget_url is missing', async () => {
    getAccounts.mockResolvedValue({
      accounts: [passkeyAccount()],
      activeAccountId: 'acc-1',
    })
    createDepositIntent.mockResolvedValue({
      intent_id: 'i1',
      memo_id: '12345',
      pool_address: 'GPOOL',
      expires_at: '2026-01-01T00:00:00Z',
    })

    await expect(
      tryHandleDepositMessage(
        {
          type: 'CREATE_DEPOSIT_INTENT',
          payload: { accountId: 'acc-1', openTransak: true, cryptoCurrency: 'XLM' },
        },
        vi.fn(),
        (data) => ({ ok: true, data })
      )
    ).rejects.toMatchObject({ code: 'transak_missing_widget_url' } satisfies Partial<BackendError>)
    expect(openTransakBuyTab).not.toHaveBeenCalled()
  })

  it('rejects Transak without cryptoCurrency', async () => {
    getAccounts.mockResolvedValue({
      accounts: [passkeyAccount()],
      activeAccountId: 'acc-1',
    })

    await expect(
      tryHandleDepositMessage(
        {
          type: 'CREATE_DEPOSIT_INTENT',
          payload: { accountId: 'acc-1', openTransak: true },
        },
        vi.fn(),
        (data) => ({ ok: true, data })
      )
    ).rejects.toMatchObject({ code: 'transak_crypto_required' } satisfies Partial<BackendError>)
    expect(createDepositIntent).not.toHaveBeenCalled()
  })
})
