import emblemUrl from 'url:../../../assets/onboarding/web/latch-logo-emblem.svg'
import closeIconUrl from 'url:../../../assets/onboarding/web/icon-close.svg'
import biometricFingerprintUrl from 'url:../../../assets/onboarding/web/biometric-fingerprint.svg'

export function OnboardingCreatePasskeyCard({
  prefetchReady,
  prefetchError,
  actionError,
  busy,
  onClose,
  onCreatePasskey,
  onGoBack,
}: {
  prefetchReady: boolean
  prefetchError: string | null
  actionError: string | null
  busy: boolean
  onClose: () => void
  onCreatePasskey: () => void
  onGoBack: () => void
}) {
  const errorMessage = actionError ?? prefetchError
  const primaryLabel = !prefetchReady
    ? 'Preparing…'
    : busy
      ? 'Creating passkey…'
      : 'Create Passkey'

  return (
    <div className="flex h-[600px] w-[420px] flex-col gap-2 rounded-[24px] bg-[#1c1c1c] p-6 shadow-[-5px_6px_7.7px_rgba(9,9,9,0.3)]">
      <div className="flex shrink-0 justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-5 items-center justify-center"
        >
          <img src={closeIconUrl} alt="" className="size-5" draggable={false} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-8">
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-6">
          <div className="flex w-full shrink-0 flex-col items-center gap-2">
            <img
              src={emblemUrl}
              alt=""
              className="h-6 w-[45px] shrink-0"
              width={45}
              height={24}
              draggable={false}
            />

            <div className="flex w-full flex-col items-center gap-[14px] text-center">
              <h1 className="w-full text-[26px] font-medium leading-[1.32] tracking-[-0.52px] text-[#fcfcfc]">
                Create Passkey
              </h1>
              <p className="w-full text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
                Protect your account with biometrics
              </p>
            </div>
          </div>

          <div className="relative flex size-[115px] shrink-0 items-center justify-center rounded-2xl bg-[#201f1e] shadow-[0px_0px_0px_0px_#262626,0px_20px_50px_0px_rgba(0,0,0,0.3)]">
            <img
              src={biometricFingerprintUrl}
              alt=""
              className="size-[76px]"
              width={76}
              height={76}
              draggable={false}
            />
          </div>

          <div className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-x-clip overflow-y-auto">
            <div className="w-full rounded-[14px] bg-[#201f1e] p-3">
              <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
                Biometric Security
              </p>
              <p className="mt-1.5 text-[14px] font-normal leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
                Use your device&apos;s fingerprint or face recognition
              </p>
            </div>

            {errorMessage ? (
              <p className="text-center text-[14px] leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2">
          <button
            type="button"
            disabled={!prefetchReady || busy}
            onClick={onCreatePasskey}
            className="relative flex h-[50px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-[#f0a300] px-5 py-3 text-[18px] font-semibold leading-[1.31] tracking-[-0.18px] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)] disabled:opacity-50"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[32px] bg-[#ffad00]"
            />
            <span className="relative whitespace-nowrap">{primaryLabel}</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
            />
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onGoBack}
            className="relative flex h-[50px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-[#2b2a29] px-5 py-3 text-[18px] font-semibold leading-[1.31] tracking-[-0.18px] text-[#d7d7d7] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)] disabled:opacity-50"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[32px] bg-[#383838]"
            />
            <span className="relative whitespace-nowrap">Go Back</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
            />
          </button>
        </div>
      </div>
    </div>
  )
}
