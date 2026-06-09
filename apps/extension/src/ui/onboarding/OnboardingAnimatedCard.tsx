import type { ReactNode } from 'react'

export function OnboardingAnimatedCard({
  stepKey,
  children,
}: {
  stepKey: string
  children: ReactNode
}) {
  return (
    <div key={stepKey} className="animate-screenIn">
      {children}
    </div>
  )
}
