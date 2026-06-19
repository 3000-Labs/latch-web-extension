import importSuccessUrl from 'url:../../../../../assets/onboarding/web/import-success.svg'

import { AddAccountBackHeader } from './AddAccountBackHeader'

function ViewMyAccountsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-[32px] border border-[#f0a300] px-5 py-3 text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#121212] shadow-[0px_12px_13.1px_-8px_rgba(246,139,7,0.1)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[32px] bg-[#ffad00]"
      />
      <span className="relative whitespace-nowrap">View My Accounts</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.26)]"
      />
    </button>
  )
}

export function AddAccountSuccessScreen({
  accountName,
  onBack,
  onViewAccounts,
}: {
  accountName: string
  onBack: () => void
  onViewAccounts: () => void
}) {
  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      <AddAccountBackHeader onBack={onBack} />

      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5">
          <div className="flex w-full flex-col items-center gap-[30px]">
            <img
              src={importSuccessUrl}
              alt=""
              className="h-[208.801px] w-[232.001px] shrink-0"
              width={232}
              height={209}
              draggable={false}
            />
            <div className="flex w-full flex-col items-center gap-3 text-center">
              <h1 className="text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
                Account Created!
              </h1>
              <p className="text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
                <span className="font-bold text-[#fcfcfc]">{accountName}</span>
                <span className="text-[#fcfcfc]"> </span>
                has been successfully set up and is now your active account.
              </p>
            </div>
          </div>
        </div>

        <ViewMyAccountsButton onClick={onViewAccounts} />
      </div>
    </div>
  )
}
