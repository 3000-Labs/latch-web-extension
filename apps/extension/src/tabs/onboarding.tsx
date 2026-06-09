import '../style.css'

import { OnboardingLayout } from '../ui/onboarding/OnboardingLayout'
import { OnboardingWelcomeCard } from '../ui/onboarding/OnboardingWelcomeCard'

export default function OnboardingTab() {
  return (
    <OnboardingLayout>
      <OnboardingWelcomeCard
        onCreateWallet={() => {
          // TODO: wire to full-screen onboarding flow
        }}
        onImportWallet={() => {
          // TODO: wire to full-screen onboarding flow
        }}
        onImportRecoveryPhrase={() => {
          // TODO: wire to full-screen onboarding flow
        }}
      />
    </OnboardingLayout>
  )
}
