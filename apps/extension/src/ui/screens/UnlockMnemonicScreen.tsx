import React from 'react'

import logoUrl from 'url:../../../assets/brand/latch-logo.svg'

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="text-center">
        <img src={logoUrl} alt="Latch" className="mx-auto h-10 w-10 object-contain" />
        <h2 className="mt-5 text-center text-[22px] font-bold leading-tight tracking-tight text-fg">
          Unlock wallet
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-muted">
          Enter the password you chose when securing your recovery phrase on this device.
        </p>
      </div>

      <label className="mt-6 block text-xs font-bold text-muted">Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        autoComplete="current-password"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canUnlock) onUnlock()
        }}
        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-fg shadow-inner outline-none focus:border-primary"
      />

      {error ? <p className="mt-3 text-center text-xs font-bold text-red-300">{error}</p> : null}

      <div className="mt-auto space-y-3 pt-6">
        <button
          type="button"
          disabled={!canUnlock}
          onClick={onUnlock}
          className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </div>
    </div>
  )
}
