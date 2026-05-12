import React, { useState } from 'react'
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Fingerprint,
  Globe,
  Info,
  KeyRound,
  Moon,
  Shield,
  Sun,
  X,
} from 'lucide-react'

import { Avatar } from '../components/Avatar'
import { CopyAddressButton } from '../components/CopyAddressButton'

const rowIconClass = 'h-[18px] w-[18px] shrink-0'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-1 text-xs font-extrabold tracking-wide text-muted/70">{children}</div>
}

function ListRow({
  label,
  leftIcon,
  right,
  onClick,
}: {
  label: string
  leftIcon: React.ReactNode
  right?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between rounded-2xl',
        'bg-surface px-4 py-[14px] text-left',
        'hover:bg-surface/65 active:bg-surface/70',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <span className="text-fg/70">{leftIcon}</span>
        <span className="text-sm font-extrabold">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-fg/50">
        {right ?? <ChevronRight className={rowIconClass} strokeWidth={2} aria-hidden />}
      </div>
    </button>
  )
}

function SettingsToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'h-6 w-11 rounded-full border border-border px-0.5 transition-colors',
        checked ? 'bg-primary' : 'bg-surface/60',
      ].join(' ')}
      aria-label="Toggle"
    >
      <span
        className={[
          'block h-5 w-5 rounded-full bg-bg transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

export function SettingsScreen({
  accountName,
  accountAddress,
  theme,
  onToggleTheme,
  biometricsEnabled,
  onChangeBiometricsEnabled,
  sidepanelPreferenceSection,
  onClose,
  onLogout,
}: {
  accountName: string
  accountAddress: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  biometricsEnabled: boolean
  onChangeBiometricsEnabled: (next: boolean) => void
  sidepanelPreferenceSection: React.ReactNode
  onClose: () => void
  onLogout: () => void
}) {
  const [networkEnabled, setNetworkEnabled] = useState(false)

  const short =
    accountAddress.length > 12
      ? `${accountAddress.slice(0, 4)}...${accountAddress.slice(-4)}`
      : accountAddress

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <button
        onClick={onClose}
        className="grid h-9 w-9 place-items-center rounded-full text-fg/70 hover:bg-surface/50 active:bg-surface/60"
        aria-label="Close"
      >
        <X className={rowIconClass} strokeWidth={2} aria-hidden />
      </button>

      <div className="mt-5 rounded-[28px] bg-surface p-4">
        <div className="flex flex-col justify-center items-center gap-3">
          <Avatar name={accountName} size={40} />
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-base font-extrabold">{accountName}</div>
            <div className="mt-1 flex items-center justify-center gap-2 text-sm font-normal text-muted/80">
              <span className="min-w-0 truncate">{short}</span>
              <CopyAddressButton address={accountAddress} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6 overflow-auto pb-8">
        <div>
          <SectionLabel>Account</SectionLabel>
          <div className="mt-3 space-y-2">
            <ListRow
              label="Recovery Phrase"
              leftIcon={<KeyRound className={rowIconClass} strokeWidth={2} aria-hidden />}
            />
          </div>
        </div>

        <div>
          <SectionLabel>Security</SectionLabel>
          <div className="mt-3 space-y-2">
            <ListRow
              label="Biometrics Authentication"
              leftIcon={<Fingerprint className={rowIconClass} strokeWidth={2} aria-hidden />}
              right={
                <SettingsToggle checked={biometricsEnabled} onChange={onChangeBiometricsEnabled} />
              }
            />
            <ListRow
              label="Passcode"
              leftIcon={<Shield className={rowIconClass} strokeWidth={2} aria-hidden />}
            />
          </div>
        </div>

        <div>
          <SectionLabel>Preferences</SectionLabel>
          <div className="mt-3 space-y-2">
            <ListRow
              label="Theme"
              leftIcon={
                theme === 'light' ? (
                  <Sun className={rowIconClass} strokeWidth={2} aria-hidden />
                ) : (
                  <Moon className={rowIconClass} strokeWidth={2} aria-hidden />
                )
              }
              right={
                <SettingsToggle
                  checked={theme === 'light'}
                  onChange={(next) => {
                    // Off = dark (default). On = light.
                    if (next && theme !== 'light') onToggleTheme()
                    if (!next && theme !== 'dark') onToggleTheme()
                  }}
                />
              }
            />
            <ListRow
              label="Network"
              leftIcon={<Globe className={rowIconClass} strokeWidth={2} aria-hidden />}
              right={<SettingsToggle checked={networkEnabled} onChange={setNetworkEnabled} />}
            />
            <ListRow
              label="Notifications"
              leftIcon={<Bell className={rowIconClass} strokeWidth={2} aria-hidden />}
            />
          </div>
        </div>

        <div>
          <SectionLabel>Support</SectionLabel>
          <div className="mt-3 space-y-2">
            <ListRow
              label="Help & Support"
              leftIcon={<CircleHelp className={rowIconClass} strokeWidth={2} aria-hidden />}
            />
            <ListRow
              label="About Latch"
              leftIcon={<Info className={rowIconClass} strokeWidth={2} aria-hidden />}
              right={<span className="text-xs font-extrabold text-muted">v0.0.0</span>}
            />
          </div>
        </div>

        {sidepanelPreferenceSection}

        <button
          onClick={onLogout}
          className="mt-2 h-12 w-full rounded-full bg-surface text-base font-extrabold text-fg hover:bg-surface/65"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
