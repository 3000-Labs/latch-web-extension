import backgroundUrl from 'url:../../../assets/onboarding/web/onboarding-background.png'

/** Figma `Web Onboarding` (4977:124757) — 1448×918 */
const ONBOARDING_BG = '#100f0f'

export function OnboardingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#100f0f]" aria-hidden>
      <img
        src={backgroundUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />
    </div>
  )
}

export { ONBOARDING_BG }
