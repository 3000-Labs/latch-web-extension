import '../style.css'

import { OnboardingFlow } from '../ui/onboarding/OnboardingFlow'
import { OnboardingLayout } from '../ui/onboarding/OnboardingLayout'

export default function OnboardingTab() {
  return (
    <OnboardingLayout>
      <OnboardingFlow />
    </OnboardingLayout>
  )
}
