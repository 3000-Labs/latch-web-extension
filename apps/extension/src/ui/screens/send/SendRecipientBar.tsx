import React from 'react'

import editIconUrl from 'url:../../../../assets/send/icon-edit.svg'

import { truncateMiddle } from '../../lib/sendAddress'

export function SendRecipientBar({
  recipientName,
  recipientAddress,
  onEdit,
}: {
  recipientName?: string
  recipientAddress: string
  onEdit: () => void
}) {
  const addressLabel = `{${truncateMiddle(recipientAddress, 6, 4)}}`

  return (
    <div className="flex w-full shrink-0 flex-col gap-5">
      <div className="flex items-start gap-5">
        <p className="min-w-0 flex-1 text-sm leading-[1.34] tracking-[-0.28px] text-[#b3b3b3]">
          To:{' '}
          {recipientName ? (
            <>
              <span className="font-medium leading-[1.3] tracking-[-0.14px] text-[#fcfcfc]">
                {recipientName}
              </span>{' '}
              {addressLabel}
            </>
          ) : (
            addressLabel
          )}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="size-5 shrink-0"
          aria-label="Edit recipient"
        >
          <img src={editIconUrl} alt="" className="size-5" aria-hidden />
        </button>
      </div>
      <div className="h-px w-full bg-stroke" aria-hidden />
    </div>
  )
}
