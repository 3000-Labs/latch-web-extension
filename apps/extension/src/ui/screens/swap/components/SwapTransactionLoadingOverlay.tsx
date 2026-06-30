import { LatchLoadingOverlay } from '../../../components/LatchLoadingOverlay'

export function SwapTransactionLoadingOverlay() {
  return (
    <LatchLoadingOverlay
      label="Swapping..."
      description="Please wait while your transaction is confirmed on the Stellar network."
    />
  )
}
