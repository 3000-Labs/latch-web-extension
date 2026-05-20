import { useCallback, useEffect, useState } from 'react'

export type AddressBookEntry = {
  id: string
  name: string
  address: string
}

const STORAGE_KEY = 'latch.addressBook'

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
