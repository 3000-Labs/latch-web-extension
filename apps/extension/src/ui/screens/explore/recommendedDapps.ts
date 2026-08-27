import latchLogoUrl from 'url:../../../../assets/brand/latch-logo.svg'

export type RecommendedDapp = {
  id: string
  name: string
  description: string
  url: string
  /** Optional — when absent the UI renders a letter-avatar fallback. */
  iconUrl?: string
}

export const RECOMMENDED_DAPPS: RecommendedDapp[] = [
  {
    id: 'counter-dapp',
    name: 'Counter dApp',
    description: 'Smart account demo',
    url: 'https://latch-testing.vercel.app/dev/counter-dapp',
    iconUrl: latchLogoUrl,
  },
  {
    id: 'lumenswap',
    name: 'LumenSwap',
    description: 'Decentralized exchange on Stellar',
    url: 'https://lumenswap.io',
  },
  {
    id: 'scopuly',
    name: 'Scopuly',
    description: 'Non-custodial DeFi wallet and SDEX terminal',
    url: 'https://scopuly.com',
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    description: 'DeFi hub and liquidity layer for Stellar',
    url: 'https://aqua.network',
  },
  {
    id: 'stellar-laboratory',
    name: 'Stellar Laboratory',
    description: 'Official transaction and contract builder',
    url: 'https://laboratory.stellar.org',
  },
  {
    id: 'stellar-expert',
    name: 'Stellar Expert',
    description: 'Block explorer and account analytics',
    url: 'https://stellar.expert',
  },
]
