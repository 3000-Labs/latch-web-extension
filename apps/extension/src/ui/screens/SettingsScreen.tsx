import React from "react"
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Fingerprint,
  Globe,
  Info,
  KeyRound,
  Shield,
  User
} from "lucide-react"

import { Avatar } from "../components/Avatar"
import { SectionCard } from "../components/SectionCard"

const rowIconClass = "h-[18px] w-[18px] shrink-0"

function ListRow({
  label,
  leftIcon,
  right,
  onClick
}: {
  label: string
  leftIcon: React.ReactNode
  right?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl bg-bg/40 px-4 py-3 text-left hover:bg-bg/60"
    >
      <div className="flex items-center gap-3">
        <span className="text-fg/80">{leftIcon}</span>
        <span className="text-sm font-extrabold">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-fg/60">
        {right ?? <ChevronRight className={rowIconClass} strokeWidth={2} aria-hidden />}
      </div>
    </button>
  )
}

function Toggle({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={[
        "h-6 w-11 rounded-full border transition-colors",
        checked ? "border-primary bg-primary" : "border-border bg-surface/60"
      ].join(" ")}
      aria-pressed={checked}
      aria-label="Toggle"
    >
      <span
        className={[
          "block h-5 w-5 translate-x-0.5 rounded-full bg-black/80 transition-transform",
          checked ? "translate-x-[22px] bg-black" : "bg-fg/80"
        ].join(" ")}
      />
    </button>
  )
}

export function SettingsScreen({
  accountName,
  accountAddress,
  biometricsEnabled,
  onChangeBiometricsEnabled,
  sidepanelPreferenceSection,
  onBack,
  onLogout
}: {
  accountName: string
  accountAddress: string
  biometricsEnabled: boolean
  onChangeBiometricsEnabled: (next: boolean) => void
  sidepanelPreferenceSection: React.ReactNode
  onBack: () => void
  onLogout: () => void
}) {
  const short =
    accountAddress.length > 12
      ? `${accountAddress.slice(0, 4)}...${accountAddress.slice(-4)}`
      : accountAddress

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/40 text-fg/80 hover:bg-surface/60"
          aria-label="Back"
        >
          <ChevronLeft className={rowIconClass} strokeWidth={2} aria-hidden />
        </button>
        <div className="text-base font-extrabold">Settings</div>
        <div className="w-9" />
      </div>

      <div className="mt-6">
        <SectionCard className="p-5">
          <div className="flex items-center gap-3">
            <Avatar name={accountName} size={44} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-extrabold">{accountName}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs font-bold text-muted">
                <span className="truncate">{short}</span>
                <button
                  className="text-fg/60 hover:text-fg"
                  aria-label="Copy address"
                  onClick={() => void navigator.clipboard.writeText(accountAddress)}
                >
                  <Copy className={rowIconClass} strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 space-y-5 overflow-auto pb-1">
        <div>
          <div className="px-1 text-xs font-extrabold text-muted">Account</div>
          <div className="mt-3 space-y-2">
            <ListRow label="Account" leftIcon={<User className={rowIconClass} strokeWidth={2} aria-hidden />} />
            <ListRow
              label="Recovery Phrase"
              leftIcon={<KeyRound className={rowIconClass} strokeWidth={2} aria-hidden />}
            />
          </div>
        </div>

        <div>
          <div className="px-1 text-xs font-extrabold text-muted">Security</div>
          <div className="mt-3 space-y-2">
            <ListRow
              label="Biometrics Authentication"
              leftIcon={<Fingerprint className={rowIconClass} strokeWidth={2} aria-hidden />}
              right={<Toggle checked={biometricsEnabled} onChange={onChangeBiometricsEnabled} />}
            />
            <ListRow label="Passcode" leftIcon={<Shield className={rowIconClass} strokeWidth={2} aria-hidden />} />
          </div>
        </div>

        <div>
          <div className="px-1 text-xs font-extrabold text-muted">Preferences</div>
          <div className="mt-3 space-y-2">
            <ListRow
              label="Network"
              leftIcon={<Globe className={rowIconClass} strokeWidth={2} aria-hidden />}
              right={<span className="text-xs font-extrabold text-muted">Public</span>}
            />
            <ListRow label="Notifications" leftIcon={<Bell className={rowIconClass} strokeWidth={2} aria-hidden />} />
          </div>
        </div>

        <div>
          <div className="px-1 text-xs font-extrabold text-muted">Support</div>
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
          className="mt-2 h-12 w-full rounded-full border border-border bg-surface text-base font-extrabold text-fg hover:bg-surface/80"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
