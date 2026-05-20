import stepCompleteUrl from 'url:../../../assets/migration/step-complete.png'
import stepPendingUrl from 'url:../../../assets/migration/step-pending.png'

export type TransactionStepperStepStatus = 'pending' | 'complete' | 'failed'

export interface TransactionStepperStep {
  id: string
  label: string
  status: TransactionStepperStepStatus
  /** Shown under label — use `~~` for unknown / pending time */
  timeLabel?: string
}

export function TransactionStepper({ steps }: { steps: TransactionStepperStep[] }) {
  return (
    <div className="flex w-full items-start">
      {steps.map((s, i) => (
        <div key={s.id} className="flex min-w-0 flex-1 items-start">
          {i > 0 ? (
            <div
              className={[
                'mt-[14px] h-[2px] min-w-[8px] flex-1 rounded-full',
                steps[i - 1]!.status === 'complete' ? 'bg-primary' : 'bg-border',
              ].join(' ')}
              aria-hidden
            />
          ) : null}
          <div className="flex w-[92px] shrink-0 flex-col items-center px-0.5">
            <img
              src={s.status === 'complete' ? stepCompleteUrl : stepPendingUrl}
              alt=""
              className={[
                'h-7 w-7 object-contain',
                s.status === 'failed'
                  ? 'rounded-full ring-2 ring-red-500/70 ring-offset-1 ring-offset-bg'
                  : '',
              ].join(' ')}
            />
            <div
              className={[
                'mt-2 text-center text-[10px] font-extrabold leading-tight',
                s.status === 'complete' ? 'text-fg' : 'text-muted',
              ].join(' ')}
            >
              {s.label}
            </div>
            <div className="mt-0.5 text-center text-[9px] text-muted">{s.timeLabel ?? '~~'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
