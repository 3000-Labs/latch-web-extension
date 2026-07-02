import lockupUrl from 'url:../../../assets/onboarding/web/latch-onboarding-lockup.svg'

export function OnboardingWelcomeCard({
  onCreateWallet,
  onImportWallet,
}: {
  onCreateWallet: () => void
  onImportWallet: () => void
}) {
  return (
    <div className="flex h-[500px] w-[420px] flex-col rounded-[24px] bg-[#1c1c1c] p-6 shadow-[-5px_6px_7.7px_rgba(9,9,9,0.3)]">
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[50px]">
          <img
            src={lockupUrl}
            alt="Latch"
            className="h-[30.51px] w-[163.547px] shrink-0"
            width={164}
            height={31}
            draggable={false}
          />

          <p className="w-[282px] shrink-0 text-center text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#fcfcfc]">
            To get started, create a new wallet or import an existing one.
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={onCreateWallet}
            className="relative flex h-[50px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-[#f0a300] px-5 py-3 text-[18px] font-semibold leading-[1.31] tracking-[-0.18px] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[32px] bg-[#ffad00]"
            />
            <span className="relative whitespace-nowrap">Create a New Wallet</span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
            />
          </button>

          <button
            type="button"
            onClick={onImportWallet}
            className="relative flex h-[50px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-[#2b2a29] px-5 py-3 text-[18px] font-semibold leading-[1.31] tracking-[-0.18px] text-[#fffffb] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[32px] bg-[#383838]"
            />
            <span className="relative whitespace-nowrap">I Have a Wallet</span>
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
