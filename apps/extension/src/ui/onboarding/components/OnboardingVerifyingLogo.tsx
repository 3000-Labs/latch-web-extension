import verifyingLogoUrl from 'url:../../../../assets/onboarding/web/verifying-logo.svg'

/** Figma LogoSymbol (315:1674) — 67×69 frame with 56×30 union rotated 20°. */
export function OnboardingVerifyingLogo() {
  return (
    <div className="relative h-[69px] w-[67px] shrink-0">
      <div className="absolute bottom-[18.46%] left-[calc(50%-0.32px)] top-[12.93%] flex w-[62.883px] -translate-x-1/2 items-center justify-center">
        <img
          src={verifyingLogoUrl}
          alt=""
          className="h-[30px] w-[56px] shrink-0 rotate-[20deg]"
          width={56}
          height={30}
          draggable={false}
        />
      </div>
    </div>
  )
}
