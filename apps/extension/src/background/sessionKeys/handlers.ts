import type { BackgroundMessage } from '@latch/types'
import { generateAndStoreSessionKey, listSessionKeys, revokeSessionKey } from '@latch/crypto'
import type { OkFn } from '../messageResponse'

function toHex(buffer: Uint8Array): string {
  return Array.prototype.map
    .call(buffer, (x: number) => ('00' + x.toString(16)).slice(-2))
    .join('')
}

export async function tryHandleSessionKeyMessage(
  message: BackgroundMessage,
  sendResponse: (response: unknown) => void,
  ok: OkFn
): Promise<boolean> {
  switch (message.type) {
    case 'GENERATE_SESSION_KEY': {
      const req = message.payload as {
        accountId: string
        name: string
        duration: string
        spendingLimitAmount: string
        spendingLimitCurrency: string
        allowed: string[]
      }
      
      const keyData = await generateAndStoreSessionKey(
        req.accountId,
        req.name,
        req.duration,
        req.spendingLimitAmount,
        req.spendingLimitCurrency,
        req.allowed
      )

      sendResponse(
        ok({
          sessionId: keyData.sessionId,
          accountId: keyData.accountId,
          rawPublicKeyHex: toHex(keyData.rawPublicKey),
          createdAt: keyData.createdAt,
        })
      )
      return true
    }

    case 'GET_SESSION_KEYS': {
      const req = message.payload as { accountId: string }
      const keys = await listSessionKeys(req.accountId)
      
      sendResponse(
        ok({
          keys: keys.map((k: any) => ({
            sessionId: k.sessionId,
            accountId: k.accountId,
            name: k.name,
            duration: k.duration,
            spendingLimitAmount: k.spendingLimitAmount,
            spendingLimitCurrency: k.spendingLimitCurrency,
            allowed: k.allowed,
            rawPublicKeyHex: toHex(k.rawPublicKey),
            createdAt: k.createdAt,
          })),
        })
      )
      return true
    }

    case 'REVOKE_SESSION_KEY': {
      const req = message.payload as { sessionId: string }
      await revokeSessionKey(req.sessionId)
      sendResponse(ok(undefined))
      return true
    }
  }

  return false
}
