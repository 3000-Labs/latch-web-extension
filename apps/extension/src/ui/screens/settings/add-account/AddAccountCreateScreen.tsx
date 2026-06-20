import userAvatarUrl from 'url:../../../../../assets/icons/user.png'

import { LatchLoadingOverlay } from '../../../components/LatchLoadingOverlay'
import { SettingsScreenHeader } from '../SettingsScreenHeader'

function CreateSmartAccountButton({
  disabled,
  onClick,
}: {
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'relative flex h-12 w-full items-center justify-center overflow-hidden rounded-[32px] border px-5 py-3 text-[16px] font-semibold leading-[1.31] tracking-[-0.16px]',
        disabled
          ? 'pointer-events-none cursor-not-allowed border-[#2b2a29] text-[#d7d7d7] shadow-[0px_12px_13.1px_-8px_rgba(56,56,56,0.1)]'
          : 'border-[#f0a300] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)]',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={[
          'pointer-events-none absolute inset-0 rounded-[32px]',
          disabled ? 'bg-[#383838]' : 'bg-[#ffad00]',
        ].join(' ')}
      />
      <span className="relative whitespace-nowrap">Create Smart Account</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
      />
    </button>
  )
}

export function AddAccountCreateScreen({
  accountName,
  onAccountNameChange,
  creating,
  createError,
  onBack,
  onCreate,
}: {
  accountName: string
  onAccountNameChange: (name: string) => void
  creating: boolean
  createError: string | null
  onBack: () => void
  onCreate: () => void
}) {
  const canCreate = accountName.trim().length > 0 && !creating

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4">
      <SettingsScreenHeader title="Create Account" onBack={onBack} />

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex w-full flex-col gap-2.5">
          <div className="flex w-full items-center justify-center rounded-[14px] bg-[#2a2928] p-3">
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
                htmlFor="add-account-name"
                className="text-base font-semibold tracking-[-0.16px] text-[#fcfcfc]"
              >
                Account Name
              </label>
              <input
                id="add-account-name"
                type="text"
                value={accountName}
                onChange={(e) => onAccountNameChange(e.target.value)}
                maxLength={32}
                disabled={creating}
                className="h-[52px] w-full rounded-xl border border-[#383838] bg-transparent px-3 text-base tracking-[-0.32px] text-[#fcfcfc] outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {createError ? (
            <p className="text-center text-[14px] leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
              {createError}
            </p>
          ) : null}
        </div>

        <CreateSmartAccountButton disabled={!canCreate} onClick={onCreate} />
      </div>

      {creating ? (
        <LatchLoadingOverlay
          label="Creating Account..."
          description="Deploying your new Smart Account to the Stellar network. This only takes a moment."
        />
      ) : null}
    </div>
  )
}
