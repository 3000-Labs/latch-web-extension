import { useState } from 'react'

import { OnboardingAnimatedCard } from './OnboardingAnimatedCard'
import { OnboardingCreateAccountCard } from './OnboardingCreateAccountCard'
import { OnboardingCreatePasskeyCard } from './OnboardingCreatePasskeyCard'
import { OnboardingPasskeySuccessCard } from './OnboardingPasskeySuccessCard'
import { OnboardingWelcomeCard } from './OnboardingWelcomeCard'
import { openWalletAfterOnboarding } from './openWalletAfterOnboarding'
import { useOnboardingPasskeyRegistration } from './useOnboardingPasskeyRegistration'

type OnboardingStep = 'welcome' | 'createAccount' | 'createPasskey' | 'passkeySuccess'

export function OnboardingFlow() {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const passkey = useOnboardingPasskeyRegistration(step === 'createPasskey')

  return (
    <OnboardingAnimatedCard stepKey={step}>
      {step === 'welcome' ? (
        <OnboardingWelcomeCard
          onCreateWallet={() => setStep('createAccount')}
          onImportWallet={() => {
            // TODO: wire import wallet flow
          }}
          onImportRecoveryPhrase={() => {
            // TODO: wire recovery phrase import flow
          }}
        />
      ) : null}

      {step === 'createAccount' ? (
        <OnboardingCreateAccountCard
          onClose={() => setStep('welcome')}
          onCreateWithPasskey={() => setStep('createPasskey')}
        />
      ) : null}

      {step === 'createPasskey' ? (
        <OnboardingCreatePasskeyCard
          prefetchReady={passkey.prefetchReady}
          prefetchError={passkey.prefetchError}
          actionError={passkey.actionError}
          busy={passkey.busy}
          onClose={() => setStep('createAccount')}
          onGoBack={() => setStep('createAccount')}
          onCreatePasskey={() => {
            void passkey.createPasskey().then(() => {
              setStep('passkeySuccess')
            })
          }}
        />
      ) : null}

      {step === 'passkeySuccess' ? (
        <OnboardingPasskeySuccessCard
          onClose={() => {
            void openWalletAfterOnboarding()
          }}
          onGoToDashboard={() => {
            void openWalletAfterOnboarding()
          }}
        />
      ) : null}
    </OnboardingAnimatedCard>
  )
}
