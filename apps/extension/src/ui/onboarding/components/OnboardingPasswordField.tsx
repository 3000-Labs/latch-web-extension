import lockIconUrl from 'url:../../../../assets/onboarding/web/icon-lock.svg'

export function OnboardingPasswordField({
  value,
  onChange,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <label className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
        Password
      </label>
      <div className="flex h-[52px] items-center justify-between rounded-[12px] border border-[#383838] px-3">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent text-[16px] font-normal leading-[1.34] tracking-[-0.28px] text-[#fcfcfc] outline-none"
        />
        <img src={lockIconUrl} alt="" className="size-5 shrink-0" draggable={false} />
      </div>
    </div>
  )
}
