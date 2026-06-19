import React from 'react'

import lockIconUrl from 'url:../../../assets/onboarding/web/icon-lock.svg'

import {
  OnboardingPrimaryButton,
  OnboardingSecondaryButton,
} from '../onboarding/components/OnboardingCardButtons'
import { OnboardingSmallEmblem } from '../onboarding/components/OnboardingSmallEmblem'

export function UnlockMnemonicScreen({
  password,
  onPasswordChange,
  onUnlock,
  error,
  busy,
}: {
  password: string
  onPasswordChange: (v: string) => void
  onUnlock: () => void
  error?: string | null
  busy?: boolean
}) {
  const canUnlock = password.length >= 8 && !busy

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex w-full shrink-0 flex-col items-center gap-2">
        <OnboardingSmallEmblem />
        <div className="flex w-full flex-col gap-2 text-center">
          <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
            Welcome Back
          </h1>
          <div className="text-[18px] font-normal leading-[1.36] tracking-[-0.36px] text-[#b3b3b3]">
            <p>Your password will not gain access </p>
            <p>to your account </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col gap-1">
          <label
            htmlFor="unlock-wallet-password"
            className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]"
          >
            Password
          </label>
          <div className="flex h-[52px] items-center justify-between rounded-[12px] border border-[#383838] px-3">
            <input
              id="unlock-wallet-password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter password"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canUnlock) onUnlock()
              }}
              className="min-w-0 flex-1 bg-transparent text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#fcfcfc] outline-none placeholder:text-[#b3b3b3]"
            />
            <img src={lockIconUrl} alt="" className="size-5 shrink-0" draggable={false} />
          </div>
          {error ? (
            <p className="mt-2 text-center text-[14px] leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
              {error}
            </p>
          ) : null}
        </div>

        {canUnlock ? (
          <OnboardingPrimaryButton onClick={onUnlock}>
            {busy ? 'Logging in…' : 'Log In'}
          </OnboardingPrimaryButton>
        ) : (
          <OnboardingSecondaryButton disabled>{busy ? 'Logging in…' : 'Log In'}</OnboardingSecondaryButton>
        )}
      </div>
    </div>
  )
}
