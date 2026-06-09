import logoUrl from 'url:../../../assets/onboarding/web/latch-onboarding-header-logo.svg'

/** Figma `Logo` (4977:124580) — 52×27 at left 32px, top 48.5px */
export function OnboardingLogo() {
  return (
    <header className="relative z-10 shrink-0 pl-8 pt-[48.5px]">
      <img
        src={logoUrl}
        alt="Latch"
        className="h-[27px] w-[52px]"
        width={52}
        height={27}
        draggable={false}
      />
    </header>
  )
}
