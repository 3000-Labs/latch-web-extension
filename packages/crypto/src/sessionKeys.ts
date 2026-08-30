/**
 * Session Keys (Ephemeral P-256)
 *
 * Implements client-side raw P-256 key generation and non-extractable storage
 * per latch-contracts#23 threat model.
 */

const DB_NAME = 'latch_session_keys'
const STORE_NAME = 'keys'
const DB_VERSION = 2

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME)
      }
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' })
      store.createIndex('accountId', 'accountId', { unique: false })
    }
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result)
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error)
  })
}

export interface SessionKeyData {
  sessionId: string
  accountId: string
  name: string
  duration: string
  spendingLimitAmount: string
  spendingLimitCurrency: string
  allowed: string[]
  privateKey: CryptoKey
  publicKey: CryptoKey
  rawPublicKey: Uint8Array
  createdAt: number
}

/**
 * Generates an ephemeral P-256 (ES256) key pair and stores it in IndexedDB.
 * The private key is non-extractable.
 */
export async function generateAndStoreSessionKey(
  accountId: string,
  name: string,
  duration: string,
  spendingLimitAmount: string,
  spendingLimitCurrency: string,
  allowed: string[]
): Promise<SessionKeyData> {
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
  const sessionId = crypto.randomUUID()

  const data: SessionKeyData = {
    sessionId,
    accountId,
    name,
    duration,
    spendingLimitAmount,
    spendingLimitCurrency,
    allowed,
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
 * Retrieves a specific stored session key.
 */
export async function getSessionKey(sessionId: string): Promise<SessionKeyData | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(sessionId)
    request.onsuccess = (e) => {
      resolve((e.target as IDBRequest).result || null)
    }
    request.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

/**
 * Lists all stored session keys for an account.
 */
export async function listSessionKeys(accountId: string): Promise<SessionKeyData[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('accountId')
    const request = index.getAll(accountId)
    request.onsuccess = (e) => {
      resolve((e.target as IDBRequest).result || [])
    }
    request.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

/**
 * Revokes (deletes) a specific stored session key.
 */
export async function revokeSessionKey(sessionId: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(sessionId)
    request.onsuccess = () => resolve()
    request.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

/**
 * Signs a payload using a specific stored session key.
 */
export async function signWithSessionKey(sessionId: string, payload: Uint8Array): Promise<Uint8Array> {
  const data = await getSessionKey(sessionId)
  if (!data) {
    throw new Error('No session key found')
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
