import { describe, expect, it, vi } from "vitest"
import {
  BackendError,
  createOrConnectPasskey,
  passkeyAuthenticationBegin,
  passkeyAuthenticationFinish,
  passkeyRegistrationBegin,
  passkeyRegistrationFinish,
  submitTxWebauthn
} from "./backend"

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

  it("passkey begin routes send chromeExtensionId when chrome.runtime.id is set", async () => {
    vi.stubGlobal("chrome", { runtime: { id: "extid-abc" } })

    const bodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        bodies.push(JSON.parse((init?.body as string) || "{}") as Record<string, unknown>)
        return {
          ok: true,
          async text() {
            return JSON.stringify({ options: { challenge: "x" } })
          },
        } as any
      })
    )

    await passkeyRegistrationBegin({ displayName: "n" })
    await passkeyAuthenticationBegin()

    expect(bodies[0]).toMatchObject({
      displayName: "n",
      chromeExtensionId: "extid-abc",
    })
    expect(bodies[1]).toMatchObject({
      chromeExtensionId: "extid-abc",
    })

    vi.unstubAllGlobals()
  })

  it("passkey finish routes send chromeExtensionId when chrome.runtime.id is set", async () => {
    vi.stubGlobal("chrome", { runtime: { id: "extid-xyz" } })

    const bodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        bodies.push(JSON.parse((init?.body as string) || "{}") as Record<string, unknown>)
        return {
          ok: true,
          async text() {
            return JSON.stringify({
              credentialId: "c",
              keyDataHex: "00",
              smartAccountAddress: "S",
              deployed: false,
              alreadyDeployed: false
            })
          }
        } as any
      })
    )

    await passkeyRegistrationFinish({ response: { id: "cred" } })
    await passkeyAuthenticationFinish({ response: { id: "cred" } })

    expect(bodies[0]).toMatchObject({
      response: { id: "cred" },
      chromeExtensionId: "extid-xyz"
    })
    expect(bodies[1]).toMatchObject({
      response: { id: "cred" },
      chromeExtensionId: "extid-xyz"
    })

    vi.unstubAllGlobals()
  })

  it("submitTxWebauthn sends chromeExtensionId when chrome.runtime.id is set", async () => {
    vi.stubGlobal("chrome", { runtime: { id: "ext-submit" } })

    const bodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        bodies.push(JSON.parse((init?.body as string) || "{}") as Record<string, unknown>)
        return {
          ok: true,
          async text() {
            return JSON.stringify({ ok: true })
          }
        } as any
      })
    )

    await submitTxWebauthn({
      txXdr: "x",
      authEntryXdr: "y",
      sigDataXdr: "z",
      keyDataHex: "00",
      contextRuleId: "ctx"
    })

    expect(bodies[0]).toMatchObject({
      txXdr: "x",
      chromeExtensionId: "ext-submit"
    })

    vi.unstubAllGlobals()
  })
})

