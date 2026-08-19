import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getActiveNetwork = vi.fn(async () => 'testnet' as const)
const getAccounts = vi.fn()
const requestWalletChallenge = vi.fn()
const resolveAccessToken = vi.fn()
const completeWalletSignInFromAssertion = vi.fn()

vi.mock('../network/config', () => ({
  getActiveNetwork: () => getActiveNetwork(),
}))

vi.mock('../storage', () => ({
  getAccounts: () => getAccounts(),
}))

vi.mock('../api/v1Client', () => ({
  requestWalletChallenge: (...args: unknown[]) => requestWalletChallenge(...args),
  resolveAccessToken: (...args: unknown[]) => resolveAccessToken(...args),
  completeWalletSignInFromAssertion: (...args: unknown[]) =>
    completeWalletSignInFromAssertion(...args),
}))

vi.mock('../cosign/v1AuthWallet', () => ({
  v1AuthWalletForLinkedAccount: (linked: { smartAccountAddress?: string }) => ({
    wallet: linked.smartAccountAddress ?? '',
    keyType: 'passkey' as const,
  }),
}))

import { BackendError } from '../api/client'
import { tryHandleV1AuthMessage } from './handlers'

describe('tryHandleV1AuthMessage network mismatch guard', () => {
  beforeEach(() => {
    getActiveNetwork.mockResolvedValue('mainnet')
    getAccounts.mockResolvedValue({
      accounts: [
        {
          id: 'acc-1',
          mode: 'passkey',
          smartAccountAddress: 'CABC',
          createdAt: 0,
        },
      ],
      activeAccountId: 'acc-1',
    })
    requestWalletChallenge.mockReset()
    resolveAccessToken.mockReset()
    completeWalletSignInFromAssertion.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws network_mismatch when challenge network disagrees with active network', async () => {
    requestWalletChallenge.mockResolvedValue({
      nonce: 'nonce-1',
      expires_in: 60,
      network: 'testnet',
    })

    const sendResponse = vi.fn()
    await expect(
      tryHandleV1AuthMessage(
        { type: 'COSIGN_V1_AUTH_CHALLENGE', payload: { linkedAccountId: 'acc-1' } },
        sendResponse,
        (data) => ({ ok: true, data })
      )
    ).rejects.toMatchObject({
      code: 'network_mismatch',
      status: 409,
    } satisfies Partial<BackendError>)

    expect(sendResponse).not.toHaveBeenCalled()
    expect(completeWalletSignInFromAssertion).not.toHaveBeenCalled()
  })

  it('passes through when challenge network matches active network', async () => {
    requestWalletChallenge.mockResolvedValue({
      nonce: 'nonce-1',
      expires_in: 60,
      network: 'mainnet',
    })

    const sendResponse = vi.fn()
    const handled = await tryHandleV1AuthMessage(
      { type: 'COSIGN_V1_AUTH_CHALLENGE', payload: { linkedAccountId: 'acc-1' } },
      sendResponse,
      (data) => ({ ok: true, data })
    )

    expect(handled).toBe(true)
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: {
        wallet: 'CABC',
        nonce: 'nonce-1',
        keyType: 'passkey',
        network: 'mainnet',
      },
    })
  })

  it('passes through when challenge omits network', async () => {
    requestWalletChallenge.mockResolvedValue({
      nonce: 'nonce-2',
      expires_in: 60,
    })

    const sendResponse = vi.fn()
    await tryHandleV1AuthMessage(
      { type: 'COSIGN_V1_AUTH_CHALLENGE', payload: { linkedAccountId: 'acc-1' } },
      sendResponse,
      (data) => ({ ok: true, data })
    )

    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      data: expect.objectContaining({ nonce: 'nonce-2', network: 'mainnet' }),
    })
  })
})
