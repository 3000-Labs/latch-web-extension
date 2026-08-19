import React, { useMemo, useState } from 'react'

import userAvatarUrl from 'url:../../../../assets/icons/user.png'

import { SettingsScreenHeader } from './SettingsScreenHeader'

function formatSmartAccountAddress(address: string) {
  if (address.length <= 8) return address
  const head = address.slice(0, 4)
  const middle = address.slice(4, -4)
  const tail = address.slice(-4)
  return { head, middle, tail }
}

export function AccountInformationScreen({
  accountName,
  accountAddress,
  onBack,
  onSave,
}: {
  accountName: string
  accountAddress: string
  onBack: () => void
  onSave: (walletName: string) => void
}) {
  const [walletName, setWalletName] = useState(accountName)
  const canSave = walletName.trim() !== accountName.trim() && walletName.trim().length > 0

  const addressParts = useMemo(() => formatSmartAccountAddress(accountAddress), [accountAddress])

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      <SettingsScreenHeader title="Account Information" onBack={onBack} />

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col gap-2.5">
          <div className="flex w-full items-center justify-center rounded-[14px] bg-[#201f1e] p-3">
            <div className="flex flex-col items-center gap-2">
              <div className="size-10 shrink-0 overflow-hidden rounded-[32px]">
                <img src={userAvatarUrl} alt="" className="size-full object-cover" />
              </div>
              <button type="button" className="text-xs font-medium tracking-[-0.12px] text-primary">
                Change Profile Picture
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-col gap-1">
              <label
                htmlFor="wallet-name"
                className="text-base font-semibold tracking-[-0.16px] text-[#fcfcfc]"
              >
                Wallet Name
              </label>
              <input
                id="wallet-name"
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                maxLength={32}
                className="h-[52px] w-full rounded-xl border border-[#383838] bg-transparent px-3 text-base tracking-[-0.32px] text-[#fcfcfc] outline-none"
              />
            </div>

            <div className="flex h-[92px] w-full flex-col gap-1">
              <span className="text-base font-semibold tracking-[-0.16px] text-[#fcfcfc]">
                Smart Account Address
              </span>
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 rounded-xl border border-[#383838] px-3 pt-3">
                  <p className="break-all text-base leading-[1.36] tracking-[-0.32px] text-[#fcfcfc]">
                    {typeof addressParts === 'string' ? (
                      addressParts
                    ) : (
                      <>
                        <span>{addressParts.head}</span>
                        <span>{addressParts.middle}</span>
                        <span>{addressParts.tail}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!canSave}
          onClick={() => onSave(walletName.trim())}
          className={[
            'relative mt-4 h-12 w-full shrink-0 rounded-[32px] border px-5 py-3 text-base font-semibold tracking-[-0.16px] transition-all',
            canSave
              ? 'cursor-pointer border-[#f0a300] bg-primary text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)] hover:brightness-105 active:scale-[0.98]'
              : 'cursor-not-allowed border-[#2b2a29] bg-[#383838] text-[#d7d7d7] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)]',
          ].join(' ')}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
          />
          Save Changes
        </button>
      </div>
    </div>
  )
}
