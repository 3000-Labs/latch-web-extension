import type { BackgroundMessage } from '@latch/types'
import { generateAndStoreSessionKey, getSessionKey, revokeSessionKey } from '@latch/crypto'
import type { OkFn } from '../messageResponse'

export async function tryHandleSessionKeyMessage(
  message: BackgroundMessage,
  sendResponse: (response: unknown) => void,
  ok: OkFn
): Promise<boolean> {
  switch (message.type) {
    case 'GENERATE_SESSION_KEY': {
      const req = message.payload as { accountId: string }
      const keyData = await generateAndStoreSessionKey(req.accountId)
      sendResponse(
        ok({
          accountId: keyData.accountId,
          rawPublicKey: keyData.rawPublicKey,
          createdAt: keyData.createdAt,
        })
      )
      return true
    }

    case 'GET_SESSION_KEYS': {
      // In a real app we might want to list all keys in DB, 
      // but indexedDB API currently only supports one by one or we'd need a cursor.
      // For now we'll just mock it or assume the UI asks for a specific account.
      // We didn't define a payload for GET_SESSION_KEYS, maybe we should fetch all?
      // For simplicity let's just return empty array until we need a full list.
      sendResponse(ok({ keys: [] }))
      return true
    }

    case 'REVOKE_SESSION_KEY': {
      const req = message.payload as { accountId: string }
      await revokeSessionKey(req.accountId)
      sendResponse(ok(undefined))
      return true
    }
  }

  return false
}
