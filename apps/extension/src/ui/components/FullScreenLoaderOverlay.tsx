import React from 'react'

import { LatchLoadingMark } from './LatchLoadingMark'

export function FullScreenLoaderOverlay({
  label,
  description,
  onCancel,
}: {
  label: string
  description?: string
  onCancel?: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-[#121212]/90" aria-hidden />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
        <LatchLoadingMark />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fbfbfb]">
            {label}
          </p>
          {description ? (
            <p className="w-[265px] text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
              {description}
            </p>
          ) : null}
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="mt-4 rounded-full border border-[#383838] bg-transparent px-4 py-2 text-sm font-semibold text-[#fcfcfc]"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
