import { useCallback, useEffect, useState } from 'react'

export type AddressBookEntry = {
  id: string
  name: string
  address: string
}

const STORAGE_KEY = 'latch.addressBook'
const MAX_ENTRIES = 20

function normalizeAddress(addr: string): string {
  return addr.trim()
}

function fallbackNameForAddress(address: string): string {
  const trimmed = address.trim()
  if (trimmed.length <= 10) return 'Recipient'
  return `Recipient (${trimmed.slice(-4)})`
}

export async function saveToAddressBook(args: {
  address: string
  name?: string
}): Promise<void> {
  const address = normalizeAddress(args.address)
  if (!address) return
  const name = (args.name?.trim() || '') || fallbackNameForAddress(address)

  const res = await chrome.storage.local.get([STORAGE_KEY])
  const raw = res[STORAGE_KEY]
  const prev: AddressBookEntry[] = Array.isArray(raw) ? (raw as AddressBookEntry[]) : []

  const existing = prev.find((e) => normalizeAddress(e.address) === address)
  const nextEntry: AddressBookEntry = existing
    ? { ...existing, name: existing.name?.trim() ? existing.name : name, address }
    : { id: crypto.randomUUID(), name, address }

  const without = prev.filter((e) => normalizeAddress(e.address) !== address)
  const next = [nextEntry, ...without].slice(0, MAX_ENTRIES)

  await chrome.storage.local.set({ [STORAGE_KEY]: next })
}

export function useAddressBook() {
  const [entries, setEntries] = useState<AddressBookEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    void chrome.storage.local.get([STORAGE_KEY]).then((res) => {
      if (cancelled) return
      const raw = res[STORAGE_KEY]
      if (Array.isArray(raw)) {
        setEntries(
          raw.filter(
            (e): e is AddressBookEntry =>
              typeof e === 'object' &&
              e != null &&
              typeof (e as AddressBookEntry).id === 'string' &&
              typeof (e as AddressBookEntry).name === 'string' &&
              typeof (e as AddressBookEntry).address === 'string'
          )
        )
      }
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback(async (next: AddressBookEntry[]) => {
    setEntries(next)
    await chrome.storage.local.set({ [STORAGE_KEY]: next })
  }, [])

  return { entries, loaded, persist }
}
