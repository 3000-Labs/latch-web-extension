const DB_NAME = 'latch-multisig-keys'
const STORE = 'device-keys'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

import { generateDeviceTransportKeyPair } from './crypto'

export async function saveDeviceKeyPair(keyPair: CryptoKeyPair): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(keyPair, 'transport-keypair')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadDeviceKeyPair(): Promise<CryptoKeyPair | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get('transport-keypair')
    req.onsuccess = () => resolve(req.result as CryptoKeyPair | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function ensureDeviceTransportKeyPair(): Promise<CryptoKeyPair> {
  const existing = await loadDeviceKeyPair()
  if (existing) return existing
  const keyPair = await generateDeviceTransportKeyPair()
  await saveDeviceKeyPair(keyPair)
  return keyPair
}
