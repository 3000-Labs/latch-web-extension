import { sendToBackground } from '../lib/backgroundClient'

/** Open the full-screen onboarding tab (popup/sidepanel must not run first-time setup). */
export async function openOnboardingTab(): Promise<void> {
  await sendToBackground({
    type: 'OPEN_ONBOARDING_TAB',
    payload: undefined,
  })
}
