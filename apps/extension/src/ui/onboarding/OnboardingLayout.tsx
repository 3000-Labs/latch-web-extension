import { useEffect, type ReactNode } from 'react'

import { OnboardingBackground, ONBOARDING_BG } from './OnboardingBackground'
import { OnboardingLogo } from './OnboardingLogo'

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
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#100f0f] text-fg">
      <OnboardingBackground />
      <OnboardingLogo />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16">
        {children}
      </main>
    </div>
  )
}
