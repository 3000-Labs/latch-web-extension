import { useEffect, type ReactNode } from 'react'

import { OnboardingBackground } from './OnboardingBackground'

const ONBOARDING_BG = '#181613'

export function OnboardingLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Latch Wallet'
    document.documentElement.style.background = ONBOARDING_BG
    document.body.style.background = ONBOARDING_BG
    return () => {
      document.title = previousTitle
      document.documentElement.style.background = ''
      document.body.style.background = ''
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#181613] text-fg">
      <OnboardingBackground />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        {children}
      </main>
    </div>
  )
}
