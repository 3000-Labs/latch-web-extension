import closeIconUrl from 'url:../../../assets/home/icon-close.svg'

export function MultisigProposalsHomeBanner({
  pendingCount,
  onOpenProposals,
  onDismiss,
}: {
  pendingCount: number
  onOpenProposals: () => void
  onDismiss: () => void
}) {
  return (
    <div className="relative mb-3 w-full rounded-[14px] border border-[#383838] bg-[#2a2928] pr-10 text-left">
      <button
        type="button"
        onClick={onOpenProposals}
        className="w-full px-4 py-3 text-left"
      >
        <span className="block text-sm font-semibold text-[#fcfcfc]">
          Multisig proposals
          {pendingCount > 0 ? (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-[#121212]">
              {pendingCount} need{pendingCount === 1 ? 's' : ''} your approval
            </span>
          ) : null}
        </span>
        <span className="block text-xs text-[#b3b3b3]">
          Create sends and approve transactions with co-owners
        </span>
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
        className="absolute right-3 top-3 inline-flex size-6 items-center justify-center rounded-full text-[#b3b3b3] hover:text-[#fcfcfc]"
      >
        <img src={closeIconUrl} alt="" className="size-4 object-contain" />
      </button>
    </div>
  )
}
