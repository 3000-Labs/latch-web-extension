import React, { useState } from 'react'

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

import { AccountInformationScreen } from './settings/AccountInformationScreen'
import { ProfileCard } from './settings/ProfileCard'
import { SettingItem } from './settings/SettingItem'
import { SettingsSection } from './settings/SettingsSection'
import { SettingsToggle } from './settings/SettingsToggle'
import { ViewAccountsScreen, type ViewAccountItem } from './settings/ViewAccountsScreen'

const rowIconClass = 'h-5 w-5 object-contain'

type SettingsView = 'menu' | 'accountInformation' | 'viewAccounts'

export function SettingsScreen({
  accountName,
  accountAddress,
  accounts,
  activeAccountId,
  biometricsEnabled,
  onChangeBiometricsEnabled,
  sidePanelEnabled,
  onChangeSidePanelEnabled,
  onSaveAccountName,
  onSelectAccount,
  onAddAccount,
  onClose,
  onLogout,
}: {
  accountName: string
  accountAddress: string
  accounts: ViewAccountItem[]
  activeAccountId?: string
  biometricsEnabled: boolean
  onChangeBiometricsEnabled: (next: boolean) => void
  sidePanelEnabled?: boolean
  onChangeSidePanelEnabled?: (next: boolean) => void
  onSaveAccountName?: (walletName: string) => void
  onSelectAccount?: (accountId: string) => void
  onAddAccount?: () => void
  onClose: () => void
  onLogout: () => void
}) {
  const [view, setView] = useState<SettingsView>('menu')

  const handleClose = () => {
    setView('menu')
    onClose()
  }

  if (view === 'viewAccounts') {
    return (
      <div className="flex h-full w-full min-h-0 flex-col overflow-y-auto rounded-bl-lg rounded-br-lg bg-[#1c1c1c] py-6 pl-6 pr-4">
        <ViewAccountsScreen
          accounts={accounts}
          activeAccountId={activeAccountId}
          onBack={() => setView('menu')}
          onAddAccount={() => onAddAccount?.()}
          onSave={(accountId) => {
            onSelectAccount?.(accountId)
            setView('menu')
          }}
        />
      </div>
    )
  }

  if (view === 'accountInformation') {
    return (
      <div className="flex h-full w-full min-h-0 flex-col overflow-y-auto rounded-bl-lg rounded-br-lg bg-[#1c1c1c] py-6 pl-6 pr-4">
        <AccountInformationScreen
          accountName={accountName}
          accountAddress={accountAddress}
          onBack={() => setView('menu')}
          onSave={(walletName) => {
            onSaveAccountName?.(walletName)
            setView('menu')
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col items-end gap-2 overflow-y-auto rounded-bl-lg rounded-br-lg bg-[#1c1c1c] py-6 pl-6 pr-4">
      <button
        type="button"
        onClick={handleClose}
        className="relative size-5 shrink-0"
        aria-label="Close settings"
      >
        <img
          src={closeIconUrl}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2"
        />
      </button>

      <div className="w-full min-h-0 flex-1">
        <ProfileCard
          name={accountName}
          address={accountAddress}
          onClick={() => setView('accountInformation')}
        />

        <div className="mt-5 flex flex-col gap-5">
          <SettingsSection label="Account">
            <SettingItem
              icon={<img src={myProfileIconUrl} alt="" className={rowIconClass} />}
              label="My Profile"
            />
            <SettingItem
              icon={<img src={myAccountsIconUrl} alt="" className={rowIconClass} />}
              label="My Accounts"
              onClick={() => setView('viewAccounts')}
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
              showChevron={false}
              rightElement={
                <SettingsToggle
                  checked={biometricsEnabled}
                  onChange={onChangeBiometricsEnabled}
                  ariaLabel="Biometrics Authentication"
                />
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
            {onChangeSidePanelEnabled ? (
              <SettingItem
                icon={<img src={networkIconUrl} alt="" className={rowIconClass} />}
                label="Side Panel"
                showChevron={false}
                rightElement={
                  <SettingsToggle
                    checked={sidePanelEnabled ?? false}
                    onChange={onChangeSidePanelEnabled}
                    ariaLabel="Enable side panel"
                  />
                }
              />
            ) : null}
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

          <SettingItem
            icon={<img src={logoutIconUrl} alt="" className={rowIconClass} />}
            label="Log Out"
            danger
            showChevron={false}
            onClick={onLogout}
          />
        </div>
      </div>
    </div>
  )
}
