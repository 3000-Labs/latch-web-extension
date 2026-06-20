import type { ButtonHTMLAttributes, ReactNode } from 'react'

function ButtonChrome({
  children,
  variant,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: 'primary' | 'secondary'
  children: ReactNode
}) {
  const isPrimary = variant === 'primary'
  return (
    <button
      type="button"
      {...props}
      className={[
        'relative flex h-[50px] w-full items-center justify-center overflow-hidden rounded-[32px] px-5 py-3 text-[18px] font-semibold leading-[1.31] tracking-[-0.18px]',
        isPrimary
          ? 'border border-[#f0a300] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)] disabled:cursor-not-allowed disabled:opacity-50'
          : 'border border-[#2b2a29] text-[#d7d7d7] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ].join(' ')}
    >
      <span
        aria-hidden
        className={[
          'pointer-events-none absolute inset-0 rounded-[32px]',
          isPrimary ? 'bg-[#ffad00]' : 'bg-[#383838]',
        ].join(' ')}
      />
      <span className="relative whitespace-nowrap">{children}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
      />
    </button>
  )
}

export function OnboardingPrimaryButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }
) {
  return <ButtonChrome variant="primary" {...props} />
}

export function OnboardingSecondaryButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }
) {
  return <ButtonChrome variant="secondary" {...props} />
}
