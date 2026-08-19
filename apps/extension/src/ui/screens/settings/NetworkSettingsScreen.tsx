import React, { useState } from 'react'

import type { Network } from '@latch/types'

function SettingsFormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <span className="text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
        {label}
      </span>
      {children}
    </div>
  )
}

export function NetworkSettingsScreen({
  currentNetwork,
  networkLabel,
  onBack,
  onSelectNetwork,
}: {
  currentNetwork: Network
  networkLabel: string
  onBack: () => void
  onSelectNetwork: (network: Network) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [confirmNetwork, setConfirmNetwork] = useState<Network | null>(null)
  const [error, setError] = useState<string | null>(null)

  const options: { id: Network; label: string; hint: string }[] = [
    { id: 'testnet', label: 'Stellar Testnet', hint: 'Safe for development and testing' },
    { id: 'mainnet', label: 'Stellar Mainnet', hint: 'Real funds — use with care' },
  ]

  async function apply(network: Network) {
    if (network === currentNetwork) {
      onBack()
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSelectNetwork(network)
      setConfirmNetwork(null)
      onBack()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (confirmNetwork) {
    const label = confirmNetwork === 'mainnet' ? 'Stellar Mainnet' : 'Stellar Testnet'
    return (
      <div className="flex w-full flex-col gap-4">
        <button
          type="button"
          onClick={() => setConfirmNetwork(null)}
          className="self-start text-sm text-[#fcfcfc]/opacity-70"
          disabled={busy}
        >
          Back
        </button>
        <h2 className="text-lg font-semibold tracking-[-0.32px] text-[#fcfcfc]">Switch network?</h2>
        <p className="text-sm leading-5 text-[#fcfcfc]/opacity-70">
          Switch to {label}? Accounts, balances, and pending activity on{' '}
          {networkLabel} stay on that network and will reappear when you switch back.
        </p>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void apply(confirmNetwork)}
          className="rounded-xl bg-[#ffad00] px-4 py-3 text-center text-base font-semibold text-[#1f1f1f] disabled:opacity-50"
        >
          {busy ? 'Switching…' : `Switch to ${label}`}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmNetwork(null)}
          className="rounded-xl border border-[#2b2a29] px-4 py-3 text-center text-base text-[#fcfcfc]"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm text-[#fcfcfc]/opacity-70"
      >
        Back
      </button>
      <h2 className="text-lg font-semibold tracking-[-0.32px] text-[#fcfcfc]">Network</h2>
      <SettingsFormField label="Current">
        <span className="text-base tracking-[-0.32px] text-[#fcfcfc]">{networkLabel}</span>
      </SettingsFormField>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const selected = opt.id === currentNetwork
          return (
            <button
              key={opt.id}
              type="button"
              disabled={busy}
              onClick={() => {
                if (opt.id === currentNetwork) return
                setConfirmNetwork(opt.id)
              }}
              className={[
                'flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left',
                selected ? 'border-[#ffad00] bg-[#2a2a2a]' : 'border-[#2b2a29] bg-transparent',
              ].join(' ')}
            >
              <span className="text-base font-medium text-[#fcfcfc]">{opt.label}</span>
              <span className="text-sm text-[#fcfcfc]/opacity-60">{opt.hint}</span>
            </button>
          )
        })}
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
