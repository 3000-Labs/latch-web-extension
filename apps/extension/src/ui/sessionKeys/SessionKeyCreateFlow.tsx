import React, { useState } from 'react'
import { Header } from '../components/Header'
import { BaseLayout } from '../components/BaseLayout'
import { Button } from '../components/Button'

export function SessionKeyCreateFlow({
  accountId,
  onBack,
}: {
  accountId: string
  onBack: () => void
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [sessionExpiry, setSessionExpiry] = useState('1 hour')

  const handleCreateSession = async () => {
    setIsCreating(true)
    try {
      // 1. Generate session key
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_SESSION_KEY',
        payload: { accountId },
      }) as { ok: boolean; data: { rawPublicKey: Uint8Array } }
      if (!response.ok) {
        throw new Error('Failed to generate session key')
      }
      const { rawPublicKey } = response.data

      // 2. Trigger passkey signing to install rule
      // TODO: construct add_context_rule tx with p256_verifier and rawPublicKey
      // Blocked on latch-contracts#21
      console.log('Session key generated', rawPublicKey)
      alert('Session key created! (Contract interaction stubbed)')
      onBack()
    } catch (e) {
      console.error(e)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <BaseLayout>
      <Header title="Create Session Key" onBack={onBack} />
      <div className="flex flex-col flex-1 p-4 space-y-6 text-white overflow-y-auto">
        <div>
          <h2 className="text-xl font-bold mb-2">Authorize a New Session</h2>
          <p className="text-sm text-neutral-400">
            A session key allows you to execute specific actions for a limited time without needing to approve every transaction with your passkey.
          </p>
        </div>

        <div className="bg-[#2B2A29] rounded-xl p-4 space-y-4 border border-[#3B3A39]">
          <div>
            <label className="text-xs text-neutral-500 uppercase font-semibold">Expiry</label>
            <select 
              value={sessionExpiry}
              onChange={(e) => setSessionExpiry(e.target.value)}
              className="w-full mt-1 bg-[#1F1F1F] border border-[#3B3A39] rounded-lg p-3 text-white appearance-none focus:border-[#FFAD00] focus:ring-1 focus:ring-[#FFAD00] outline-none"
            >
              <option value="1 hour">1 Hour</option>
              <option value="24 hours">24 Hours</option>
              <option value="7 days">7 Days</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-500 uppercase font-semibold">Target Contract</label>
            <input 
              type="text" 
              placeholder="Contract Address" 
              className="w-full mt-1 bg-[#1F1F1F] border border-[#3B3A39] rounded-lg p-3 text-white placeholder-neutral-500 focus:border-[#FFAD00] focus:ring-1 focus:ring-[#FFAD00] outline-none" 
            />
          </div>

          <div>
            <label className="text-xs text-neutral-500 uppercase font-semibold">Allowed Functions</label>
            <input 
              type="text" 
              placeholder="e.g. transfer, swap" 
              className="w-full mt-1 bg-[#1F1F1F] border border-[#3B3A39] rounded-lg p-3 text-white placeholder-neutral-500 focus:border-[#FFAD00] focus:ring-1 focus:ring-[#FFAD00] outline-none" 
            />
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#090909] border-t border-[#2B2A29]">
        <Button 
          onClick={handleCreateSession} 
          disabled={isCreating}
          className="w-full py-4 text-lg font-bold rounded-xl"
        >
          {isCreating ? 'Creating...' : 'Authorize Session'}
        </Button>
      </div>
    </BaseLayout>
  )
}
