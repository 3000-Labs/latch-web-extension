import { describe, expect, it, vi } from "vitest"
import { BackendError, createOrConnectPasskey } from "./backend"

describe("background/backend", () => {
  it("maps non-2xx JSON error into BackendError with status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return {
          ok: false,
          status: 500,
          async text() {
            return JSON.stringify({ error: "boom" })
          }
        } as any
      })
    )

    await expect(
      createOrConnectPasskey({ keyDataHex: "aa", credentialId: "cred" } as any)
    ).rejects.toMatchObject({ name: "BackendError", status: 500, message: "boom" } satisfies Partial<BackendError>)
  })

  it("maps AbortError into BackendError(code=timeout)", async () => {
    vi.useFakeTimers()

    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const e = new Error("Aborted")
            ;(e as any).name = "AbortError"
            reject(e)
          })
        })
      })
    )

    const p = createOrConnectPasskey({ keyDataHex: "aa", credentialId: "cred" } as any)
    const asserted = expect(p).rejects.toMatchObject({
      name: "BackendError",
      code: "timeout"
    } satisfies Partial<BackendError>)

    await vi.advanceTimersByTimeAsync(21_000)
    await asserted

    vi.useRealTimers()
  })
})

