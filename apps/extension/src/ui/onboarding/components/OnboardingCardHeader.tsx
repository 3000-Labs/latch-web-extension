import arrowIconUrl from 'url:../../../../assets/onboarding/web/icon-arrow-back.svg'
import closeIconUrl from 'url:../../../../assets/onboarding/web/icon-close.svg'

export function OnboardingCardHeader({
  onBack,
  onClose,
  showBack = true,
}: {
  onBack?: () => void
  onClose: () => void
  showBack?: boolean
}) {
  return (
    <div className="flex w-full shrink-0 items-center justify-between">
      {showBack && onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex size-6 items-center justify-center"
        >
          <img src={arrowIconUrl} alt="" className="size-6" draggable={false} />
        </button>
      ) : (
        <div className="size-6 shrink-0" aria-hidden />
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex size-5 items-center justify-center"
      >
        <img src={closeIconUrl} alt="" className="size-5" draggable={false} />
      </button>
    </div>
  )
}
