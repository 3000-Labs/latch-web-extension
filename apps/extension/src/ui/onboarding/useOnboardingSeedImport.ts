import { useCallback, useState } from 'react'

import type { ImportMnemonicAccountRequest, ImportMnemonicAccountResponse, SetSetupStateRequest } from '@latch/types'

import { useSeedPhraseWords } from '../screens/import-seed/useSeedPhraseWords'
import { friendlyError, sendToBackground } from '../lib/backgroundClient'

const VERIFY_MIN_MS = 1200

export function useOnboardingSeedImport() {
  const seedWords = useSeedPhraseWords()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [importing, setImporting] = useState(false)

  const reset = useCallback(() => {
    seedWords.reset()
    setPassword('')
    setConfirmPassword('')
    setVerifying(false)
    setImporting(false)
  }, [seedWords])

  const verifyPhrase = useCallback(async (): Promise<boolean> => {
    if (!seedWords.isValid) return false
    setVerifying(true)
    const started = Date.now()
    try {
      await new Promise((resolve) => setTimeout(resolve, VERIFY_MIN_MS))
      const elapsed = Date.now() - started
      if (elapsed < VERIFY_MIN_MS) {
        await new Promise((resolve) => setTimeout(resolve, VERIFY_MIN_MS - elapsed))
      }
      return seedWords.isValid
    } finally {
      setVerifying(false)
    }
  }, [seedWords.isValid])

  const importWallet = useCallback(async (): Promise<boolean> => {
    if (password.length < 8 || password !== confirmPassword || !seedWords.isValid) {
      return false
    }

    setImporting(true)
    try {
      const req: ImportMnemonicAccountRequest = {
        mnemonic: seedWords.mnemonic,
        remember: true,
        encryptionPassword: password,
      }
      const res = await sendToBackground<
        ImportMnemonicAccountRequest,
        ImportMnemonicAccountResponse
      >({
        type: 'IMPORT_MNEMONIC_ACCOUNT',
        payload: req,
      })
      if (!res.ok) throw new Error(friendlyError(res.error))

      const setupReq: SetSetupStateRequest = {
        setupState: 'has_account',
        accountPublicKey: res.data!.smartAccountAddress,
      }
      await sendToBackground<SetSetupStateRequest, unknown>({
        type: 'SET_SETUP_STATE',
        payload: setupReq,
      })
      return true
    } catch {
      return false
    } finally {
      setImporting(false)
    }
  }, [confirmPassword, password, seedWords.isValid, seedWords.mnemonic])

  return {
    words: seedWords.words,
    setWordAt: seedWords.setWordAt,
    fillFromPaste: seedWords.fillFromPaste,
    isValidPhrase: seedWords.isValid,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    verifying,
    importing,
    verifyPhrase,
    importWallet,
    reset,
  }
}
