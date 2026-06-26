import { afterEach, beforeEach, vi } from 'vitest'
import { createChromeMock } from './chromeMock'

declare global {
  var chrome: ReturnType<typeof createChromeMock>
}

beforeEach(() => {
  globalThis.chrome = createChromeMock()
})

afterEach(() => {
  vi.restoreAllMocks()
})
