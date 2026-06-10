import emblemUrl from 'url:../../../../assets/onboarding/web/emblem-card-small.svg'

export function OnboardingSmallEmblem() {
  return (
    <img
      src={emblemUrl}
      alt=""
      className="h-5 w-[38px] shrink-0"
      width={38}
      height={20}
      draggable={false}
    />
  )
}
