import { Address, Asset, Keypair, scValToNative, xdr } from '@stellar/stellar-sdk'
import { describe, expect, it, vi, afterEach } from 'vitest'

import {
  buildSacProbesForHistory,
  fetchSmartAccountPayments,
  stellarAddressEquals,
} from './smartAccountTransactions'

const PASSPHRASE = 'Test SDF Network ; September 2015'
const C_SMART = 'CDBBGLSWWHWK52REY7GK5HWAQGAJJ4GP5O75LOM3F4INN6W4KT6DPBVY'
const G_CLASSIC = 'GBBD47IF6L27R6SAA3BVWFXNUG7QLYZNH7ZWK5CT4OEK2LDXZ2BJZK2'
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const SENDER = Keypair.random().publicKey()

function horizonAccountJson(balances: unknown[]) {
  return {
    id: G_CLASSIC,
    sequence: '1',
    subentry_count: balances.length,
    balances,
  }
}

function scValTopicB64(val: xdr.ScVal): string {
  const bytes = new Uint8Array(val.toXDR())
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!)
  return btoa(s)
}

function makeTransferEvent(params: {
  from: string
  to: string
  amountRaw: bigint
  txHash: string
  eventId: string
  ledgerClosedAt: string
}): Record<string, unknown> {
  const amountParts = new xdr.Int128Parts({
    hi: xdr.Int64.fromString('0'),
    lo: xdr.Uint64.fromString(params.amountRaw.toString()),
  })
  return {
    id: params.eventId,
    txHash: params.txHash,
    topic: [
      scValTopicB64(xdr.ScVal.scvSymbol('transfer')),
      scValTopicB64(new Address(params.from).toScVal()),
      scValTopicB64(new Address(params.to).toScVal()),
    ],
    value: scValTopicB64(xdr.ScVal.scvI128(amountParts)),
    ledgerClosedAt: params.ledgerClosedAt,
  }
}

describe('stellarAddressEquals', () => {
  it('compares strkeys via Address normalization', () => {
    expect(stellarAddressEquals(SENDER, SENDER)).toBe(true)
    expect(stellarAddressEquals(SENDER, C_SMART)).toBe(false)
  })
})

describe('makeTransferEvent', () => {
  it('encodes topics and amount for SAC transfer parsing', () => {
    const ev = makeTransferEvent({
      from: SENDER,
      to: C_SMART,
      amountRaw: 5_000_000n,
      txHash: 'tx',
      eventId: 'evt',
      ledgerClosedAt: '2024-01-01T00:00:00Z',
    })
    const topics = ev.topic as string[]
    expect(String(scValToNative(xdr.ScVal.fromXDR(topics[1]!, 'base64')))).toBe(SENDER)
    expect(String(scValToNative(xdr.ScVal.fromXDR(topics[2]!, 'base64')))).toBe(C_SMART)
    expect(scValToNative(xdr.ScVal.fromXDR(String(ev.value), 'base64'))).toBe(5_000_000n)
  })
})

describe('buildSacProbesForHistory', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('includes native XLM and G trustline SAC contracts', async () => {
    const usdcSac = new Asset('USDC', USDC_ISSUER).contractId(PASSPHRASE)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify(
            horizonAccountJson([
              { asset_type: 'native', balance: '10.0000000' },
              {
                asset_type: 'credit_alphanum4',
                asset_code: 'USDC',
                asset_issuer: USDC_ISSUER,
                balance: '5.0000000',
              },
            ]),
          ),
        ),
      ),
    )

    const probes = await buildSacProbesForHistory({
      horizonUrl: 'https://horizon-testnet.stellar.org',
      networkPassphrase: PASSPHRASE,
      gAddress: G_CLASSIC,
    })

    expect(probes.some((p) => p.code === 'XLM')).toBe(true)
    expect(probes.some((p) => p.code === 'USDC' && p.sacContractId === usdcSac)).toBe(true)
  })
})

describe('fetchSmartAccountPayments', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('merges and dedupes SAC events with horizon by transaction hash', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/accounts/') && u.includes('/operations?') && init?.method !== 'POST') {
        return new Response(
          JSON.stringify({
            _embedded: {
              records: [
                {
                  id: '1',
                  type: 'invoke_host_function',
                  transaction_hash: 'hash-a',
                  source_account: G_CLASSIC,
                  created_at: '2024-01-01T00:00:00Z',
                },
              ],
            },
          }),
        )
      }
      if (u.includes('/accounts/') && !u.includes('/operations') && init?.method !== 'POST') {
        return new Response(
          JSON.stringify(horizonAccountJson([{ asset_type: 'native', balance: '1.0000000' }])),
        )
      }
      if (u.includes('/operations/1/effects')) {
        return new Response(
          JSON.stringify({
            _embedded: {
              records: [
                {
                  type: 'contract_credited',
                  contract: C_SMART,
                  amount: '10.0000000',
                  asset_type: 'native',
                },
              ],
            },
          }),
        )
      }
      if (init?.method === 'POST' && String(init.body).includes('getLatestLedger')) {
        return new Response(JSON.stringify({ result: { sequence: 50_000 } }))
      }
      if (init?.method === 'POST' && String(init.body).includes('getEvents')) {
        return new Response(JSON.stringify({ result: { events: [] } }))
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const rows = await fetchSmartAccountPayments({
      cAddress: C_SMART,
      gAddress: G_CLASSIC,
      horizonUrl: 'https://horizon-testnet.stellar.org',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: PASSPHRASE,
    })

    expect(rows.length).toBe(1)
    expect(rows[0]!.transactionHash).toBe('hash-a')
    expect(rows[0]!.to).toBe(C_SMART)
  })

  it('includes USDC SAC transfer events', async () => {
    const usdcSac = new Asset('USDC', USDC_ISSUER).contractId(PASSPHRASE)

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/accounts/') && !u.includes('/operations') && init?.method !== 'POST') {
        return new Response(
          JSON.stringify(
            horizonAccountJson([
              { asset_type: 'native', balance: '1.0000000' },
              {
                asset_type: 'credit_alphanum4',
                asset_code: 'USDC',
                asset_issuer: USDC_ISSUER,
                balance: '5.0000000',
              },
            ]),
          ),
        )
      }
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as {
          method: string
          params?: { filters?: { contractIds?: string[] }[] }
        }
        if (body.method === 'getLatestLedger') {
          return new Response(JSON.stringify({ result: { sequence: 50_000 } }))
        }
        if (body.method === 'getEvents') {
          const contractId = body.params?.filters?.[0]?.contractIds?.[0]
          if (contractId === usdcSac) {
            return new Response(
              JSON.stringify({
                result: {
                  events: [
                    makeTransferEvent({
                      from: SENDER,
                      to: C_SMART,
                      amountRaw: 5_000_000n,
                      txHash: 'usdc-tx-1',
                      eventId: 'evt-usdc-1',
                      ledgerClosedAt: '2024-06-01T12:00:00Z',
                    }),
                  ],
                },
              }),
            )
          }
          return new Response(JSON.stringify({ result: { events: [] } }))
        }
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const rows = await fetchSmartAccountPayments({
      cAddress: C_SMART,
      gAddress: G_CLASSIC,
      horizonUrl: 'https://horizon-testnet.stellar.org',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: PASSPHRASE,
    })

    const usdc = rows.find((r) => r.assetCode === 'USDC')
    expect(usdc).toBeDefined()
    expect(usdc!.transactionHash).toBe('usdc-tx-1')
    expect(usdc!.to).toBe(C_SMART)
    expect(usdc!.amount).toBe('0.5')
  })

  it('merges native and USDC SAC events in one call', async () => {
    const nativeSac = Asset.native().contractId(PASSPHRASE)
    const usdcSac = new Asset('USDC', USDC_ISSUER).contractId(PASSPHRASE)

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/accounts/') && !u.includes('/operations') && init?.method !== 'POST') {
        return new Response(
          JSON.stringify(
            horizonAccountJson([
              { asset_type: 'native', balance: '1.0000000' },
              {
                asset_type: 'credit_alphanum4',
                asset_code: 'USDC',
                asset_issuer: USDC_ISSUER,
                balance: '5.0000000',
              },
            ]),
          ),
        )
      }
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as {
          method: string
          params?: { filters?: { contractIds?: string[] }[] }
        }
        if (body.method === 'getLatestLedger') {
          return new Response(JSON.stringify({ result: { sequence: 50_000 } }))
        }
        if (body.method === 'getEvents') {
          const contractId = body.params?.filters?.[0]?.contractIds?.[0]
          if (contractId === nativeSac) {
            return new Response(
              JSON.stringify({
                result: {
                  events: [
                    makeTransferEvent({
                      from: SENDER,
                      to: C_SMART,
                      amountRaw: 10_000_000n,
                      txHash: 'xlm-tx-1',
                      eventId: 'evt-xlm-1',
                      ledgerClosedAt: '2024-06-02T12:00:00Z',
                    }),
                  ],
                },
              }),
            )
          }
          if (contractId === usdcSac) {
            return new Response(
              JSON.stringify({
                result: {
                  events: [
                    makeTransferEvent({
                      from: SENDER,
                      to: C_SMART,
                      amountRaw: 2_000_000n,
                      txHash: 'usdc-tx-2',
                      eventId: 'evt-usdc-2',
                      ledgerClosedAt: '2024-06-01T12:00:00Z',
                    }),
                  ],
                },
              }),
            )
          }
          return new Response(JSON.stringify({ result: { events: [] } }))
        }
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const rows = await fetchSmartAccountPayments({
      cAddress: C_SMART,
      gAddress: G_CLASSIC,
      horizonUrl: 'https://horizon-testnet.stellar.org',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: PASSPHRASE,
    })

    expect(rows.length).toBe(2)
    expect(rows[0]!.assetCode).toBe('XLM')
    expect(rows[1]!.assetCode).toBe('USDC')
  })

  it('filters SAC contract events client-side (no server topic filter)', async () => {
    const nativeSac = Asset.native().contractId(PASSPHRASE)
    const otherRecipient = Keypair.random().publicKey()

    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as {
          method: string
          params?: { filters?: { contractIds?: string[]; topics?: unknown }[] }
        }
        if (body.method === 'getLatestLedger') {
          return new Response(JSON.stringify({ result: { sequence: 50_000 } }))
        }
        if (body.method === 'getEvents') {
          const filter = body.params?.filters?.[0]
          expect(filter?.contractIds?.[0]).toBe(nativeSac)
          expect(filter?.topics).toBeUndefined()
          return new Response(
            JSON.stringify({
              result: {
                events: [
                  {
                    topic: [scValTopicB64(xdr.ScVal.scvSymbol('fee'))],
                    txHash: 'fee-tx',
                    id: 'fee-1',
                  },
                  makeTransferEvent({
                    from: SENDER,
                    to: otherRecipient,
                    amountRaw: 1_000_000n,
                    txHash: 'other-tx',
                    eventId: 'other-1',
                    ledgerClosedAt: '2024-06-03T12:00:00Z',
                  }),
                  makeTransferEvent({
                    from: SENDER,
                    to: C_SMART,
                    amountRaw: 3_000_000n,
                    txHash: 'mine-tx',
                    eventId: 'mine-1',
                    ledgerClosedAt: '2024-06-03T13:00:00Z',
                  }),
                ],
              },
            }),
          )
        }
      }
      if (String(_url).includes('/accounts/') && !String(_url).includes('/operations')) {
        return new Response(
          JSON.stringify(horizonAccountJson([{ asset_type: 'native', balance: '1.0000000' }])),
        )
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const rows = await fetchSmartAccountPayments({
      cAddress: C_SMART,
      gAddress: G_CLASSIC,
      horizonUrl: 'https://horizon-testnet.stellar.org',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: PASSPHRASE,
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]!.transactionHash).toBe('mine-tx')
  })
})
