import type { CosignWalletRecord } from '@latch/types'

import { fromHex, toHex } from './crypto'

const DB_NAME = 'latch-cosign-wck'
const STORE = 'wck-records'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveCosignWalletRecord(record: CosignWalletRecord): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(record, record.id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCosignWalletRecord(id: string): Promise<CosignWalletRecord | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result as CosignWalletRecord | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function getCosignWalletRecordByAddress(
  walletRef: string
): Promise<CosignWalletRecord | undefined> {
  const all = await listCosignWalletRecords()
  return all.find((r) => r.walletRef === walletRef)
}

export async function listCosignWalletRecords(): Promise<CosignWalletRecord[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve((req.result as CosignWalletRecord[]) ?? [])
    req.onerror = () => reject(req.error)
  })
}

export function wckBytesFromRecord(record: CosignWalletRecord): Uint8Array {
  return fromHex(record.wckHex)
}

export function wckHexFromBytes(bytes: Uint8Array): string {
  return toHex(bytes)
}

export function newCosignWalletRecordId(): string {
  return crypto.randomUUID()
}
