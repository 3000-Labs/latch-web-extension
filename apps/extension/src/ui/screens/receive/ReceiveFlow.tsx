import React, { useState } from 'react'
import type { SmartAccountBalanceRow } from '@latch/types'
import { SelectTokenScreen } from './SelectTokenScreen'
import { ReceiveQrScreen } from './ReceiveQrScreen'
import { ReceiptConfirmScreen } from './ReceiptConfirmScreen'
import type { ReceiveToken } from './ReceiveTokenCard'

export type ReceiveStep = 'selectToken' | 'qr' | 'receipt'

export function ReceiveFlow({
  smartAccountAddress,
  portfolioRows,
  portfolioLoading,
  portfolioError,
  onBackToHome,
}: {
  smartAccountAddress: string
  portfolioRows: SmartAccountBalanceRow[]
  portfolioLoading: boolean
  portfolioError: string | null
  onBackToHome: () => void
}) {
  const [step, setStep] = useState<ReceiveStep>('selectToken')
  const [selectedToken, setSelectedToken] = useState<ReceiveToken | null>(null)

  // Simulation states
  const [simulationData, setSimulationData] = useState<{
    amount: string
    date: string
    fromAddress: string
  } | null>(null)

  const handleSelectToken = (token: ReceiveToken) => {
    setSelectedToken(token)
    setStep('qr')
  }

  const handleSimulateReceive = () => {
    if (!selectedToken) return

    // Get current date formatted like: "May 20th, 2026 14:24:34"
    const now = new Date()
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    const monthName = months[now.getMonth()]
    const day = now.getDate()
    
    // Add ordinal suffix
    let suffix = 'th'
    if (day === 1 || day === 21 || day === 31) suffix = 'st'
    else if (day === 2 || day === 22) suffix = 'nd'
    else if (day === 3 || day === 23) suffix = 'rd'
    
    const year = now.getFullYear()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    const dateStr = `${monthName} ${day}${suffix}, ${year} ${hours}:${minutes}:${seconds}`

    // Mock amounts for simulation based on token
    let simAmount = '10.0'
    if (selectedToken.symbol === 'XLM') simAmount = '50.0'
    else if (selectedToken.symbol === 'USDC') simAmount = '100.00'
    else if (selectedToken.symbol === 'EURC') simAmount = '75.00'

    // Mock from-address
    const fromAddr = selectedToken.symbol === 'XLM'
      ? 'GDN2NW3J...H6JK'
      : 'GBBD47IF...LA5'

    setSimulationData({
      amount: simAmount,
      date: dateStr,
      fromAddress: fromAddr,
    })

    setStep('receipt')
  }

  const handleCloseReceipt = () => {
    // Reset flow and go back to home screen
    setSelectedToken(null)
    setSimulationData(null)
    setStep('selectToken')
    onBackToHome()
  }

  if (step === 'selectToken') {
    return (
      <SelectTokenScreen
        smartAccountAddress={smartAccountAddress}
        portfolioRows={portfolioRows}
        portfolioLoading={portfolioLoading}
        portfolioError={portfolioError}
        onBack={onBackToHome}
        onSelectToken={handleSelectToken}
      />
    )
  }

  if (step === 'qr' && selectedToken) {
    return (
      <ReceiveQrScreen
        token={selectedToken}
        onBack={() => setStep('selectToken')}
        onSimulateReceive={handleSimulateReceive}
      />
    )
  }

  if (step === 'receipt' && selectedToken && simulationData) {
    return (
      <ReceiptConfirmScreen
        amount={simulationData.amount}
        symbol={selectedToken.symbol}
        date={simulationData.date}
        status="Succeeded"
        fromAddress={simulationData.fromAddress}
        network="Stellar"
        onClose={handleCloseReceipt}
      />
    )
  }

  return null
}
