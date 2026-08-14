import latchLogoUrl from 'url:../../../../assets/brand/latch-logo.svg'

export type RecommendedDapp = {
  id: string
  name: string
  description: string
  url: string
  iconUrl: string
}

export const RECOMMENDED_DAPPS: RecommendedDapp[] = [
  {
    id: 'counter-dapp',
    name: 'Counter dApp',
    description: 'Smart account demo',
    url: 'https://latch-testing.vercel.app/dev/counter-dapp',
    iconUrl: latchLogoUrl,
  },
]
