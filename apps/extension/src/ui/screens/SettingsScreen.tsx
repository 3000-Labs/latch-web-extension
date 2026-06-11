import React from 'react'

import closeIconUrl from 'url:../../../assets/home/icon-close.svg'
import aboutIconUrl from 'url:../../../assets/home/settings-about.svg'
import addressBookIconUrl from 'url:../../../assets/home/settings-address-book.svg'
import biometricsIconUrl from 'url:../../../assets/home/settings-biometrics.svg'
import helpIconUrl from 'url:../../../assets/home/settings-help.svg'
import logoutIconUrl from 'url:../../../assets/home/settings-logout.svg'
import multisigIconUrl from 'url:../../../assets/home/settings-multisig.svg'
import myAccountsIconUrl from 'url:../../../assets/home/settings-my-accounts.svg'
import myProfileIconUrl from 'url:../../../assets/home/settings-my-profile.svg'
import networkIconUrl from 'url:../../../assets/home/settings-network.svg'
import notificationsIconUrl from 'url:../../../assets/home/settings-notifications.svg'
import passwordIconUrl from 'url:../../../assets/home/settings-password.svg'
import permissionsIconUrl from 'url:../../../assets/home/settings-permissions.svg'
import recoveryPhraseIconUrl from 'url:../../../assets/home/settings-recovery-phrase.svg'
import signersIconUrl from 'url:../../../assets/home/settings-signers.svg'

import { ProfileCard } from './settings/ProfileCard'
import { SettingItem } from './settings/SettingItem'
import { SettingsSection } from './settings/SettingsSection'
import { SettingsToggle } from './settings/SettingsToggle'

const rowIconClass = 'h-5 w-5 object-contain'

export function SettingsScreen({
  accountName,
  accountAddress,
  biometricsEnabled,
  onChangeBiometricsEnabled,
  sidepanelPreferenceSection,
  onClose,
  onLogout,
}: {
  accountName: string
  accountAddress: string
  biometricsEnabled: boolean
  onChangeBiometricsEnabled: (next: boolean) => void
  sidepanelPreferenceSection?: React.ReactNode
  onClose: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-bg pl-6 pr-4 py-6 animate-screenIn">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-5 w-5 shrink-0"
          aria-label="Close settings"
        >
          <img src={closeIconUrl} alt="" className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-auto pb-4">
        <ProfileCard name={accountName} address={accountAddress} />

        <div className="mt-5 flex flex-col gap-5">
          <SettingsSection label="Account">
            <SettingItem
              icon={<img src={myProfileIconUrl} alt="" className={rowIconClass} />}
              label="My Profile"
            />
            <SettingItem
              icon={<img src={myAccountsIconUrl} alt="" className={rowIconClass} />}
              label="My Accounts"
            />
            <SettingItem
              icon={<img src={addressBookIconUrl} alt="" className={rowIconClass} />}
              label="Address Book"
            />
            <SettingItem
              icon={<img src={multisigIconUrl} alt="" className={rowIconClass} />}
              label="Multisig Wallets"
            />
            <SettingItem
              icon={<img src={recoveryPhraseIconUrl} alt="" className={rowIconClass} />}
              label="Recovery Phrase"
            />
          </SettingsSection>

          <SettingsSection label="Security">
            <SettingItem
              icon={<img src={biometricsIconUrl} alt="" className={rowIconClass} />}
              label="Biometrics Authentication"
              rightElement={
                <SettingsToggle checked={biometricsEnabled} onChange={onChangeBiometricsEnabled} />
              }
            />
            <SettingItem
              icon={<img src={passwordIconUrl} alt="" className={rowIconClass} />}
              label="Password"
            />
            <SettingItem
              icon={<img src={signersIconUrl} alt="" className={rowIconClass} />}
              label="Signers"
            />
            <SettingItem
              icon={<img src={permissionsIconUrl} alt="" className={rowIconClass} />}
              label="Permissions"
            />
          </SettingsSection>

          <SettingsSection label="Preferences">
            <SettingItem
              icon={<img src={networkIconUrl} alt="" className={rowIconClass} />}
              label="Network"
            />
            <SettingItem
              icon={<img src={notificationsIconUrl} alt="" className={rowIconClass} />}
              label="Notifications"
            />
          </SettingsSection>

          <SettingsSection label="Support">
            <SettingItem
              icon={<img src={helpIconUrl} alt="" className={rowIconClass} />}
              label="Help & Support"
            />
            <SettingItem
              icon={<img src={aboutIconUrl} alt="" className={rowIconClass} />}
              label="About Latch"
            />
          </SettingsSection>

          {sidepanelPreferenceSection ? (
            <div className="w-full">{sidepanelPreferenceSection}</div>
          ) : null}

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-[14px] bg-card p-3 text-left"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#1e1e1e] p-1">
              <img src={logoutIconUrl} alt="" className={rowIconClass} />
            </div>
            <span className="text-sm tracking-[-0.28px] text-[#ea471e]">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
