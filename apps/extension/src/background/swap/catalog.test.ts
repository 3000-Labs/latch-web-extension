import { Asset, Networks } from '@stellar/stellar-sdk'
import { describe, expect, it } from 'vitest'

import { buildSwapProviderTokenRegistry, type SwapProviderTokenRegistry } from '@latch/swap'
import type { SmartAccountBalanceRow } from '@latch/types'

import type { TokenListItem } from '../assetTokenLists'
import {
  buildPayTokensFromBalances,
  buildReceiveTokensFromListsAndBalances,
  listItemToSwapToken,
  resolveListItemContractId,
  resolveSwapTokenDisplayName,
  sortReceiveTokens,
  swapTokenIdFromParts,
} from './catalog'

const PASSPHRASE = Networks.TESTNET
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const USDC_CONTRACT = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA'
const NATIVE_CONTRACT = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'

function testSwapRegistry(): SwapProviderTokenRegistry {
  return buildSwapProviderTokenRegistry([
    {
      contractId: USDC_CONTRACT,
      symbol: 'USDC',
      issuer: USDC_ISSUER,
      assetId: 'USDC',
      label: `USDC:${USDC_ISSUER}`,
    },
    {
      contractId: NATIVE_CONTRACT,
      symbol: 'XLM',
      assetId: 'native',
      label: 'native',
    },
  ])
}

function xlmRow(amount: string): SmartAccountBalanceRow {
  return {
    code: 'XLM',
    sacContractId: NATIVE_CONTRACT,
    amount,
    assetId: 'native',
    decimals: 7,
  }
}

function usdcRow(amount: string): SmartAccountBalanceRow {
  return {
    code: 'USDC',
    issuer: USDC_ISSUER,
    sacContractId: USDC_CONTRACT,
    amount,
    decimals: 7,
  }
}

const mockUsdcListItem: TokenListItem = {
  code: 'USDC',
  issuer: USDC_ISSUER,
  contract: USDC_CONTRACT,
  icon: 'https://example.com/usdc.png',
  name: 'USD Coin',
  decimals: 7,
}

const mockEurcListItem: TokenListItem = {
  code: 'EURC',
  issuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
  icon: 'https://example.com/eurc.png',
  name: 'EUR Coin',
  decimals: 7,
}

describe('swapTokenIdFromParts', () => {
  it('uses issuer-qualified id for issued assets', () => {
    expect(swapTokenIdFromParts('USDC', USDC_ISSUER)).toBe(`USDC:${USDC_ISSUER}`)
  })

  it('uses native id for XLM', () => {
    expect(swapTokenIdFromParts('XLM')).toBe('native')
  })
})

describe('buildPayTokensFromBalances', () => {
  it('returns only positive balances', () => {
    const tokens = buildPayTokensFromBalances([xlmRow('10'), usdcRow('0')])
    expect(tokens).toHaveLength(1)
    expect(tokens[0]!.symbol).toBe('XLM')
  })

  it('filters to provider-registry tokens when registry is supplied', () => {
    const eurcIssuer = 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2'
    const eurcRow: SmartAccountBalanceRow = {
      code: 'EURC',
      issuer: eurcIssuer,
      sacContractId: new Asset('EURC', eurcIssuer).contractId(PASSPHRASE),
      amount: '5',
      decimals: 7,
    }
    const tokens = buildPayTokensFromBalances([usdcRow('2'), eurcRow], testSwapRegistry())
    expect(tokens).toHaveLength(1)
    expect(tokens[0]!.symbol).toBe('USDC')
    expect(tokens[0]!.contractId).toBe(USDC_CONTRACT)
  })

  it('falls back to XLM when no positive balances', () => {
    const tokens = buildPayTokensFromBalances([xlmRow('0')])
    expect(tokens).toHaveLength(1)
    expect(tokens[0]!.id).toBe('native')
  })
})

describe('resolveListItemContractId', () => {
  it('prefers provider registry contract over list contract field', () => {
    const mainnetListContract = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75'
    const item: TokenListItem = {
      code: 'USDC',
      issuer: USDC_ISSUER,
      contract: mainnetListContract,
      icon: 'https://example.com/usdc.png',
    }
    expect(resolveListItemContractId(item, PASSPHRASE, testSwapRegistry())).toBe(USDC_CONTRACT)
    expect(resolveListItemContractId(item, PASSPHRASE, testSwapRegistry())).not.toBe(
      mainnetListContract
    )
  })

  it('derives SAC from code and issuer when registry has no match', () => {
    const item: TokenListItem = {
      code: 'USDC',
      issuer: USDC_ISSUER,
      icon: 'https://example.com/usdc.png',
    }
    expect(resolveListItemContractId(item, PASSPHRASE)).toBe(
      new Asset('USDC', USDC_ISSUER).contractId(PASSPHRASE)
    )
  })
})

describe('listItemToSwapToken', () => {
  it('merges balance row data when held', () => {
    const token = listItemToSwapToken(mockUsdcListItem, PASSPHRASE, usdcRow('25'))
    expect(token?.balance).toBe('25')
    expect(token?.name).toBe('USD Coin')
    expect(token?.contractId).toBe(USDC_CONTRACT)
  })

  it('uses zero balance when not held', () => {
    const token = listItemToSwapToken(mockUsdcListItem, PASSPHRASE)
    expect(token?.balance).toBe('0')
  })
})

describe('resolveSwapTokenDisplayName', () => {
  it('never surfaces provider CODE:ISSUER labels', () => {
    expect(
      resolveSwapTokenDisplayName('USDC', {
        providerLabel: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      })
    ).toBe('USD Coin')
    expect(resolveSwapTokenDisplayName('XLM', { providerLabel: 'native' })).toBe('Stellar Lumens')
  })

  it('prefers list names when human readable', () => {
    expect(resolveSwapTokenDisplayName('FOO', { listName: 'Foo Token' })).toBe('Foo Token')
  })
})

describe('buildReceiveTokensFromListsAndBalances', () => {
  it('includes only provider-registry tokens when registry is supplied', () => {
    const tokens = buildReceiveTokensFromListsAndBalances(
      [mockUsdcListItem, mockEurcListItem],
      [xlmRow('12')],
      PASSPHRASE,
      'testnet',
      testSwapRegistry()
    )
    const ids = tokens.map((t) => t.id)
    expect(ids).toContain('native')
    expect(ids).toContain(`USDC:${USDC_ISSUER}`)
    expect(ids).not.toContain(`EURC:${mockEurcListItem.issuer}`)
    expect(tokens.find((t) => t.id === `USDC:${USDC_ISSUER}`)?.contractId).toBe(USDC_CONTRACT)
    expect(tokens.find((t) => t.id === `USDC:${USDC_ISSUER}`)?.name).toBe('USD Coin')
    expect(tokens.find((t) => t.id === 'native')?.contractId).toBe(NATIVE_CONTRACT)
    expect(tokens.find((t) => t.id === 'native')?.name).toBe('Stellar Lumens')
  })

  it('includes XLM and listed tokens for XLM-only account without registry', () => {
    const tokens = buildReceiveTokensFromListsAndBalances(
      [mockUsdcListItem, mockEurcListItem],
      [xlmRow('12')],
      PASSPHRASE,
      'testnet'
    )
    const ids = tokens.map((t) => t.id)
    expect(ids).toContain('native')
    expect(ids).toContain(`USDC:${USDC_ISSUER}`)
    expect(tokens.find((t) => t.id === 'native')?.balance).toBe('12')
    expect(tokens.find((t) => t.id === `USDC:${USDC_ISSUER}`)?.balance).toBe('0')
  })

  it('merges held unlisted token into receive catalog', () => {
    const customIssuer = 'GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC'
    const custom: SmartAccountBalanceRow = {
      code: 'CUSTOM',
      issuer: customIssuer,
      sacContractId: new Asset('CUSTOM', customIssuer).contractId(PASSPHRASE),
      amount: '3',
      decimals: 7,
    }
    const tokens = buildReceiveTokensFromListsAndBalances(
      [],
      [xlmRow('1'), custom],
      PASSPHRASE,
      'testnet'
    )
    expect(tokens.some((t) => t.symbol === 'CUSTOM' && t.balance === '3')).toBe(true)
  })

  it('prefers balance row contract and amount on duplicate id', () => {
    const held = usdcRow('99')
    const token = buildReceiveTokensFromListsAndBalances(
      [mockUsdcListItem],
      [xlmRow('1'), held],
      PASSPHRASE,
      'testnet'
    ).find((t) => t.id === `USDC:${USDC_ISSUER}`)
    expect(token?.balance).toBe('99')
    expect(token?.contractId).toBe(USDC_CONTRACT)
  })

  it('excludes mainnet-only USDC from external list on testnet', () => {
    const mainnetUsdc: TokenListItem = {
      code: 'USDC',
      issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      contract: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
      icon: 'https://example.com/usdc-mainnet.png',
      name: 'USD Coin',
    }
    const tokens = buildReceiveTokensFromListsAndBalances(
      [mainnetUsdc],
      [xlmRow('5')],
      PASSPHRASE,
      'testnet'
    )
    expect(tokens.some((t) => t.issuer === mainnetUsdc.issuer)).toBe(false)
    expect(tokens.some((t) => t.id === `USDC:${USDC_ISSUER}`)).toBe(true)
  })
})

describe('sortReceiveTokens', () => {
  it('sorts held tokens before unheld', () => {
    const held = { ...listItemToSwapToken(mockUsdcListItem, PASSPHRASE)!, balance: '5' }
    const unheld = { ...listItemToSwapToken(mockEurcListItem, PASSPHRASE)!, balance: '0' }
    const sorted = sortReceiveTokens([unheld, held])
    expect(sorted[0]!.balance).toBe('5')
    expect(sorted[1]!.balance).toBe('0')
  })
})
