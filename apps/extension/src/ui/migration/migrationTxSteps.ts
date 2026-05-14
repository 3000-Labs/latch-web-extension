import type { TransactionStepperStep } from '../components/TransactionStepper'

export type MigrationTxUiPhase = 'idle' | 'initiated' | 'submitted' | 'confirmed' | 'failed'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/** Local UI timestamp like `05-07 13:38:58` */
export function formatMigrationStepTime(d = new Date()): string {
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

const LABELS = ['Transaction initiated', 'Submitted to network', 'Confirmed on ledger'] as const

function step(
  index: 0 | 1 | 2,
  status: TransactionStepperStep['status'],
  timeLabel?: string,
): TransactionStepperStep {
  return {
    id: `migration-tx-${index}`,
    label: LABELS[index],
    status,
    timeLabel,
  }
}

export function buildMigrationTxSteps(
  phase: MigrationTxUiPhase,
  times: { initiated?: string; submitted?: string; confirmed?: string },
): TransactionStepperStep[] {
  if (phase === 'idle') {
    return [step(0, 'pending'), step(1, 'pending'), step(2, 'pending')]
  }
  if (phase === 'initiated') {
    return [step(0, 'complete', times.initiated ?? formatMigrationStepTime()), step(1, 'pending'), step(2, 'pending')]
  }
  if (phase === 'submitted') {
    return [
      step(0, 'complete', times.initiated ?? formatMigrationStepTime()),
      step(1, 'complete', times.submitted ?? formatMigrationStepTime()),
      step(2, 'pending'),
    ]
  }
  if (phase === 'confirmed') {
    return [
      step(0, 'complete', times.initiated ?? formatMigrationStepTime()),
      step(1, 'complete', times.submitted ?? formatMigrationStepTime()),
      step(2, 'complete', times.confirmed ?? formatMigrationStepTime()),
    ]
  }
  // failed
  const t0 = times.initiated ?? formatMigrationStepTime()
  if (times.submitted) {
    return [step(0, 'complete', t0), step(1, 'complete', times.submitted), step(2, 'failed', '~~')]
  }
  return [step(0, 'complete', t0), step(1, 'failed', '~~'), step(2, 'pending')]
}
