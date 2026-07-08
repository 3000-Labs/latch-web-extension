import type { StoredAccount } from '@latch/types'

export type MultisigPasskeyOption = {
  accountId: string
  label: string
}

export function MultisigPasskeyPicker({
  options,
  selectedAccountId,
  onSelect,
  disabled,
}: {
  options: MultisigPasskeyOption[]
  selectedAccountId?: string
  onSelect: (accountId: string) => void
  disabled?: boolean
}) {
  if (options.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-[#b3b3b3]">
        Choose a passkey on this device
      </p>
      {options.map((option) => {
        const selected = option.accountId === selectedAccountId
        return (
          <button
            key={option.accountId}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.accountId)}
            className={[
              'w-full rounded-[14px] bg-[#201f1e] p-3 text-left disabled:cursor-not-allowed disabled:opacity-50',
              selected ? 'border border-[#f0a300]' : 'border border-transparent',
            ].join(' ')}
          >
            <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]">
              {option.label}
            </p>
            <p className="mt-1 text-[13px] leading-[1.34] tracking-[-0.26px] text-[#b3b3b3]">
              Use this device&apos;s fingerprint, face, or PIN — not a phone QR code
            </p>
          </button>
        )
      })}
    </div>
  )
}

export function toMultisigPasskeyOptions(
  accounts: StoredAccount[],
  labelForAccount: (account: StoredAccount, index: number) => string
): MultisigPasskeyOption[] {
  return accounts.map((account, index) => ({
    accountId: account.id,
    label: labelForAccount(account, index),
  }))
}
