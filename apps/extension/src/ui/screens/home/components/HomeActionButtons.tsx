import React from 'react'

import fundIconUrl from 'url:../../../../../assets/home/icon-fund.svg'
import receiveIconUrl from 'url:../../../../../assets/home/icon-receive.svg'
import sendIconUrl from 'url:../../../../../assets/home/icon-send.svg'
import swapIconUrl from 'url:../../../../../assets/home/icon-swap-action.svg'

type Action = {
  label: string
  iconUrl: string
  onClick?: () => void
}

export function HomeActionButtons({
  onFund,
  onSend,
  onReceive,
  onSwap,
}: {
  onFund?: () => void
  onSend?: () => void
  onReceive?: () => void
  onSwap?: () => void
}) {
  const actions: Action[] = [
    { label: 'Fund', iconUrl: fundIconUrl, onClick: onFund },
    { label: 'Send', iconUrl: sendIconUrl, onClick: onSend },
    { label: 'Receive', iconUrl: receiveIconUrl, onClick: onReceive },
    { label: 'Swap', iconUrl: swapIconUrl, onClick: onSwap },
  ]

  return (
    <div className="flex w-full items-center justify-between self-stretch">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          className="flex w-[70.6px] shrink-0 flex-col items-center gap-2"
        >
          <span className="flex size-16 shrink-0 items-center justify-center rounded-[36px] bg-[rgb(var(--latch-surface-2))]">
            {action.label === 'Fund' ? (
              <span className="relative size-6 shrink-0">
                <span className="absolute inset-[18.75%] flex items-center justify-center">
                  <img
                    src={action.iconUrl}
                    alt=""
                    className="block size-full object-contain"
                    aria-hidden
                  />
                </span>
              </span>
            ) : (
              <img src={action.iconUrl} alt="" className="size-6 shrink-0" aria-hidden />
            )}
          </span>
          <span className="w-full text-center text-sm font-normal leading-[1.34] tracking-[-0.28px] text-muted">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}
