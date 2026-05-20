import React from 'react'

import {
  TransactionStepper,
  type TransactionStepperStep,
} from '../../components/TransactionStepper'

export function TransactionDetailProgress({ stepTimes }: { stepTimes: [string, string, string] }) {
  const steps: TransactionStepperStep[] = [
    { id: 'init', label: 'Transaction initiated', status: 'complete', timeLabel: stepTimes[0] },
    { id: 'submit', label: 'Submitted to network', status: 'complete', timeLabel: stepTimes[1] },
    { id: 'confirm', label: 'Confirmed on ledger', status: 'complete', timeLabel: stepTimes[2] },
  ]
  return (
    <div className="mt-8 px-1">
      <TransactionStepper steps={steps} />
    </div>
  )
}
