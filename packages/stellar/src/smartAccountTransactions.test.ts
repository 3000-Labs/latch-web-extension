import { describe, expect, it, vi, afterEach } from 'vitest'

import { fetchSmartAccountPayments } from './smartAccountTransactions'

describe('fetchSmartAccountPayments', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('merges and dedupes SAC events with horizon by transaction hash', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/operations?') && init?.method !== 'POST') {
        return new Response(
          JSON.stringify({
            _embedded: {
              records: [
                {
                  id: '1',
                  type: 'invoke_host_function',
                  transaction_hash: 'hash-a',
                  source_account: 'GCLASSIC',
                  created_at: '2024-01-01T00:00:00Z',
                },
              ],
            },
          }),
        )
      }
      if (u.includes('/operations/1/effects')) {
        return new Response(
          JSON.stringify({
            _embedded: {
              records: [
                {
                  type: 'contract_credited',
                  contract: 'C_SMART',
                  amount: '10.0000000',
                  asset_type: 'native',
                },
              ],
            },
          }),
        )
      }
      if (u.includes('rpc') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as { method: string }
        if (body.method === 'getLatestLedger') {
          return new Response(JSON.stringify({ result: { sequence: 50_000 } }))
        }
        if (body.method === 'getEvents') {
          return new Response(JSON.stringify({ result: { events: [] } }))
        }
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const rows = await fetchSmartAccountPayments({
      cAddress: 'C_SMART',
      gAddress: 'GCLASSIC',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: 'Test SDF Network ; September 2015',
    })

    expect(rows.length).toBe(1)
    expect(rows[0]!.transactionHash).toBe('hash-a')
    expect(rows[0]!.to).toBe('C_SMART')
  })
})
