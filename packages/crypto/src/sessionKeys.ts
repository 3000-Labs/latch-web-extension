/**
 * Session Keys (Ephemeral P-256)
 *
 * Implements client-side raw P-256 key generation and non-extractable storage
 * per latch-contracts#23 threat model.
 */

const DB_NAME = 'latch_session_keys'
const STORE_NAME = 'keys'

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'accountId' })
      }
    }
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result)
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error)
  })
}

export interface SessionKeyData {
  accountId: string
  privateKey: CryptoKey
  publicKey: CryptoKey
  rawPublicKey: Uint8Array
  createdAt: number
}

/**
 * Generates an ephemeral P-256 (ES256) key pair and stores it in IndexedDB.
 * The private key is non-extractable.
 */
export async function generateAndStoreSessionKey(accountId: string): Promise<SessionKeyData> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false, // non-extractable
    ['sign', 'verify']
  )

  const rawPublicKeyBuf = await crypto.subtle.exportKey('raw', keyPair.publicKey)
  const rawPublicKey = new Uint8Array(rawPublicKeyBuf)

  const data: SessionKeyData = {
    accountId,
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    rawPublicKey,
    createdAt: Date.now(),
  }

  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(data)
    request.onsuccess = () => resolve(data)
    request.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

/**
 * Retrieves the stored session key for an account.
 */
export async function getSessionKey(accountId: string): Promise<SessionKeyData | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(accountId)
    request.onsuccess = (e) => {
      resolve((e.target as IDBRequest).result || null)
    }
    request.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

/**
 * Revokes (deletes) the stored session key for an account.
 */
export async function revokeSessionKey(accountId: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(accountId)
    request.onsuccess = () => resolve()
    request.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

/**
 * Signs a payload using the stored session key.
 */
export async function signWithSessionKey(accountId: string, payload: Uint8Array): Promise<Uint8Array> {
  const data = await getSessionKey(accountId)
  if (!data) {
    throw new Error('No session key found for account')
  }

  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    data.privateKey,
    payload as unknown as BufferSource
  )

  return new Uint8Array(signature)
}
