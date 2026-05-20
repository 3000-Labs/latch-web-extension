import { afterEach, beforeEach, vi } from 'vitest'
import { createChromeMock } from './chromeMock'

declare global {
  // eslint-disable-next-line no-var
  var chrome: any
}

beforeEach(() => {
  globalThis.chrome = createChromeMock()
})

afterEach(() => {
  vi.restoreAllMocks()
})
