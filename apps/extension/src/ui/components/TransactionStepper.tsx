import React from 'react'
import stepCompleteUrl from 'url:../../../assets/migration/step-complete.png'
import stepPendingUrl from 'url:../../../assets/migration/step-pending.png'

export type TransactionStepperStepStatus = 'pending' | 'complete' | 'failed'

export interface TransactionStepperStep {
  id: string
  label: string
  status: TransactionStepperStepStatus
  timeLabel?: string
}

export function TransactionStepper({ steps }: { steps: TransactionStepperStep[] }) {
  // If the last step is not complete, we might want the line to be gray, but in the design it's a solid orange line connecting the completed steps.
  // For simplicity and matching the exact mockup, we render a solid orange line.
  return (
    <div className="relative flex w-full items-start justify-between px-2">
      {/* Base orange connecting line */}
      <div
        className="absolute top-[14px] left-[15%] right-[15%] h-[4px] bg-[#FFAD00] z-0"
        aria-hidden
      />

      {steps.map((s) => (
        <div key={s.id} className="relative z-10 flex w-[90px] flex-col items-center">
          <img
            src={s.status === 'complete' ? stepCompleteUrl : stepPendingUrl}
            alt=""
            className="h-[32px] w-[32px] object-contain"
          />
          <div
            className={[
              'mt-2 text-center text-[13px] font-semibold leading-snug',
              s.status === 'complete' ? 'text-white' : 'text-[#8E8E93]',
            ].join(' ')}
          >
            {s.label}
          </div>
          <div className="mt-1 text-center text-[11px] text-[#8E8E93]">{s.timeLabel ?? '~~'}</div>
        </div>
      ))}
    </div>
  )
}
