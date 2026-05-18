import React from 'react'

import { ImportSeedLogo } from './ImportSeedLogo'

export function ImportSeedEncryptionForm({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmChange,
  onSubmit,
  onBack,
  error,
  busy,
}: {
  password: string
  confirmPassword: string
  onPasswordChange: (v: string) => void
  onConfirmChange: (v: string) => void
  onSubmit: () => void
  onBack: () => void
  error?: string | null
  busy?: boolean
}) {
  const canSubmit = password.length >= 8 && password === confirmPassword && !busy

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ImportSeedLogo />
      <h2 className="mt-5 text-center text-[22px] font-bold leading-tight tracking-tight text-fg">
        Secure your wallet
      </h2>
      <p className="mt-2 text-center text-sm font-medium text-muted">
        Create a password to encrypt your recovery phrase on this device
      </p>

      <label className="mt-6 block text-xs font-bold text-muted">Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        autoComplete="new-password"
        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-fg shadow-inner outline-none focus:border-primary"
      />

      <label className="mt-3 block text-xs font-bold text-muted">Confirm password</label>
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => onConfirmChange(e.target.value)}
        autoComplete="new-password"
        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-fg shadow-inner outline-none focus:border-primary"
      />

      {error ? <p className="mt-3 text-center text-xs font-bold text-red-300">{error}</p> : null}

      <div className="mt-auto space-y-3 pt-6">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Importing…' : 'Continue'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft"
        >
          Back
        </button>
      </div>
    </div>
  )
}
