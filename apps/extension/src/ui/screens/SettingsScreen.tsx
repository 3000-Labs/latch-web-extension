import React, { useState } from 'react'
import {
  ArrowLeftRight,
  Bell,
  CircleHelp,
  Fingerprint,
  Globe,
  Info,
  KeyRound,
  LogOut,
  Moon,
  Shield,
  Sun,
  User,
} from 'lucide-react'

import { SettingsHeader } from './settings/SettingsHeader'
import { ProfileCard } from './settings/ProfileCard'
import { SettingsSection } from './settings/SettingsSection'
import { SettingItem } from './settings/SettingItem'
import { SettingsToggle } from './settings/SettingsToggle'

const rowIconSize = 18

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
  onOpenMigrateAssets,
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
  onOpenMigrateAssets?: () => void
}) {
  const [networkEnabled, setNetworkEnabled] = useState(false)

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-screenIn">
      <SettingsHeader onClose={onClose} />

      <div className="mt-3 shrink-0">
        <ProfileCard name={accountName} address={accountAddress} />
      </div>

      <div className="mt-6 flex-1 space-y-6 overflow-auto pb-8 pr-1">
        {/* Account Section */}
        <SettingsSection label="Account">
          <SettingItem
            icon={<User size={rowIconSize} strokeWidth={2.5} />}
            label="Account"
            onClick={() => {
              // Action if any, otherwise behaves as simple menu
            }}
          />
          <SettingItem
            icon={<KeyRound size={rowIconSize} strokeWidth={2.5} />}
            label="Recovery Phrase"
            onClick={() => {
              // Action if any
            }}
          />
          {onOpenMigrateAssets && (
            <SettingItem
              icon={<ArrowLeftRight size={rowIconSize} strokeWidth={2.5} />}
              label="Migrate classic assets"
              onClick={onOpenMigrateAssets}
            />
          )}
        </SettingsSection>

        {/* Security Section */}
        <SettingsSection label="Security">
          <SettingItem
            icon={<Fingerprint size={rowIconSize} strokeWidth={2.5} />}
            label="Biometrics Authentication"
            rightElement={
              <SettingsToggle checked={biometricsEnabled} onChange={onChangeBiometricsEnabled} />
            }
          />
          <SettingItem
            icon={<Shield size={rowIconSize} strokeWidth={2.5} />}
            label="Passcode"
            onClick={() => {
              // Action if any
            }}
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection label="Preferences">
          <SettingItem
            icon={
              theme === 'light' ? (
                <Sun size={rowIconSize} strokeWidth={2.5} />
              ) : (
                <Moon size={rowIconSize} strokeWidth={2.5} />
              )
            }
            label="Theme"
            rightElement={
              <SettingsToggle
                checked={theme === 'light'}
                onChange={(next) => {
                  if (next && theme !== 'light') onToggleTheme()
                  if (!next && theme !== 'dark') onToggleTheme()
                }}
              />
            }
          />
          <SettingItem
            icon={<Globe size={rowIconSize} strokeWidth={2.5} />}
            label="Network"
            value="Public"
            onClick={() => {
              // Action if any
            }}
          />
          <SettingItem
            icon={<Bell size={rowIconSize} strokeWidth={2.5} />}
            label="Notifications"
            onClick={() => {
              // Action if any
            }}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection label="Support">
          <SettingItem
            icon={<CircleHelp size={rowIconSize} strokeWidth={2.5} />}
            label="Help & Support"
            onClick={() => {
              // Action if any
            }}
          />
          <SettingItem
            icon={<Info size={rowIconSize} strokeWidth={2.5} />}
            label="About Latch"
            value="v1.0.0"
            onClick={() => {
              // Action if any
            }}
          />
        </SettingsSection>

        {/* Dynamic Sidepanel preference section */}
        {sidepanelPreferenceSection && <div className="pt-2">{sidepanelPreferenceSection}</div>}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm font-extrabold text-red-400 hover:bg-red-500/20 active:bg-red-500/30 transition-all cursor-pointer"
        >
          <LogOut size={16} strokeWidth={2.5} />
          Logout
        </button>
      </div>
    </div>
  )
}
