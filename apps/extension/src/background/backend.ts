import type {
  BackendAccountsResponse,
  BackendWebauthnAuthenticationFinishRequest,
  BackendWebauthnAuthenticationFinishResponse,
  BackendWebauthnBeginResponse,
  BackendWebauthnRegistrationFinishRequest,
  BackendWebauthnRegistrationFinishResponse,
  BuildDelegatedTxRequest,
  BuildDelegatedTxResponse,
  BuildSendTxRequest,
  BuildSendTxResponse,
  BuildTxRequest,
  BuildTxResponse,
  SetupSendRulesRequest,
  SetupSendRulesResponse,
  CreateOrConnectFreighterRequest,
  CreateOrConnectFreighterResponse,
  CreateOrConnectPasskeyRequest,
  CreateOrConnectPasskeyResponse,
  CreateOrConnectPhantomRequest,
  CreateOrConnectPhantomResponse,
  FreighterSmartAccountStatusResponse,
  SerializableError,
  SubmitDelegatedTxRequest,
  SubmitPhantomTxRequest,
  SubmitTxResponse,
  SubmitWebauthnTxRequest,
  PrepareSignRequest,
  PrepareSignResponse,
  SignPayloadStoreResponse,
} from '@latch/types'

const DEFAULT_LATCH_API_URL = 'https://v0-latch-stellar.vercel.app'

/** Plasmo inlines `process.env.PLASMO_PUBLIC_*` at build time; keep a direct `process.env` reference. */
function latchApiBaseUrl(): string {
  const raw = process.env.PLASMO_PUBLIC_LATCH_API_URL as string | undefined
  const s = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : DEFAULT_LATCH_API_URL
  return s.replace(/\/$/, '')
}

const BASE_URL = latchApiBaseUrl()

export class BackendError extends Error {
  public readonly status?: number
  public readonly code?: string
  public readonly details?: unknown

  constructor(message: string, opts?: { status?: number; code?: string; details?: unknown }) {
    super(message)
    this.name = 'BackendError'
    this.status = opts?.status
    this.code = opts?.code
    this.details = opts?.details
  }

  toSerializable(): SerializableError {
    return { message: this.message, status: this.status, code: this.code }
  }
}

/** When set, WebAuthn `/begin` routes should use `rp.id === chromeExtensionId` (Chrome extension WebAuthn). */
function chromeExtensionIdForWebauthn(): string | undefined {
  try {
    if (
      typeof chrome !== 'undefined' &&
      typeof chrome.runtime?.id === 'string' &&
      chrome.runtime.id.length > 0
    ) {
      return chrome.runtime.id
    }
  } catch {
    // ignore
  }
  return undefined
}

function webauthnBeginBody(extra: Record<string, unknown> = {}): string {
  const id = chromeExtensionIdForWebauthn()
  return JSON.stringify({
    ...extra,
    ...(id ? { chromeExtensionId: id } : {}),
  })
}

/** Same RP context as begin — server verifyRegistration/Authentication must use rpID === extension id. */
function webauthnFinishBody(payload: object): string {
  const id = chromeExtensionIdForWebauthn()
  return JSON.stringify({
    ...(payload as Record<string, unknown>),
    ...(id ? { chromeExtensionId: id } : {}),
  })
}

async function jsonFetch<TRes>(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<TRes> {
  const controller = new AbortController()
  const timeoutMs = init?.timeoutMs ?? 20_000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: init?.credentials ?? 'include',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })

    const text = await res.text()
    let data: unknown
    if (text) {
      const trimmed = text.trimStart()
      if (trimmed.startsWith('<')) {
        throw new BackendError(
          `API returned HTML instead of JSON (${res.status}). Check PLASMO_PUBLIC_LATCH_API_URL (${BASE_URL}) and that ${path} exists on your Latch API.`,
          { status: res.status }
        )
      }
      try {
        data = JSON.parse(text) as unknown
      } catch {
        throw new BackendError(
          `API response was not valid JSON (${res.status}). Check PLASMO_PUBLIC_LATCH_API_URL (${BASE_URL}) and route ${path}.`,
          { status: res.status }
        )
      }
    }

    if (!res.ok) {
      const body = data as { error?: string; message?: string; code?: string } | undefined
      throw new BackendError(body?.error ?? body?.message ?? `Request failed: ${res.status}`, {
        status: res.status,
        code: body?.code,
        details: data,
      })
    }

    return data as TRes
  } catch (err) {
    if (err instanceof BackendError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new BackendError('Request timed out', { code: 'timeout' })
    }
    throw new BackendError(err instanceof Error ? err.message : String(err))
  } finally {
    clearTimeout(timeout)
  }
}

export async function getFreighterSmartAccountStatus(
  gAddress: string
): Promise<FreighterSmartAccountStatusResponse> {
  const q = encodeURIComponent(gAddress)
  return await jsonFetch<FreighterSmartAccountStatusResponse>(
    `/api/smart-account/freighter?gAddress=${q}`,
    { method: 'GET' }
  )
}

export async function createOrConnectFreighter(
  req: CreateOrConnectFreighterRequest
): Promise<CreateOrConnectFreighterResponse> {
  return await jsonFetch<CreateOrConnectFreighterResponse>('/api/smart-account/freighter', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

/** GET predict/deploy flow: returns smart account address; POST only if not yet deployed. */
export async function ensureFreighterSmartAccountDeployed(
  gAddress: string
): Promise<CreateOrConnectFreighterResponse> {
  const status = await getFreighterSmartAccountStatus(gAddress)
  if (status.deployed) {
    return { smartAccountAddress: status.smartAccountAddress, alreadyDeployed: true }
  }
  return await createOrConnectFreighter({ gAddress })
}

export async function createOrConnectPhantom(
  req: CreateOrConnectPhantomRequest
): Promise<CreateOrConnectPhantomResponse> {
  return await jsonFetch<CreateOrConnectPhantomResponse>('/api/smart-account', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function createOrConnectPasskey(
  req: CreateOrConnectPasskeyRequest
): Promise<CreateOrConnectPasskeyResponse> {
  return await jsonFetch<CreateOrConnectPasskeyResponse>('/api/smart-account/webauthn', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function passkeyRegistrationBegin(args?: {
  displayName?: string
}): Promise<BackendWebauthnBeginResponse> {
  const extra: Record<string, unknown> = {}
  if (args?.displayName !== undefined && args.displayName !== '') {
    extra.displayName = args.displayName
  }
  return await jsonFetch<BackendWebauthnBeginResponse>('/api/webauthn/registration/begin', {
    method: 'POST',
    body: webauthnBeginBody(extra),
  })
}

export async function passkeyRegistrationFinish(
  req: BackendWebauthnRegistrationFinishRequest
): Promise<BackendWebauthnRegistrationFinishResponse> {
  return await jsonFetch<BackendWebauthnRegistrationFinishResponse>(
    '/api/webauthn/registration/finish',
    {
      method: 'POST',
      body: webauthnFinishBody(req),
    }
  )
}

export async function passkeyAuthenticationBegin(): Promise<BackendWebauthnBeginResponse> {
  return await jsonFetch<BackendWebauthnBeginResponse>('/api/webauthn/authentication/begin', {
    method: 'POST',
    body: webauthnBeginBody({}),
  })
}

export async function passkeyAuthenticationFinish(
  req: BackendWebauthnAuthenticationFinishRequest
): Promise<BackendWebauthnAuthenticationFinishResponse> {
  return await jsonFetch<BackendWebauthnAuthenticationFinishResponse>(
    '/api/webauthn/authentication/finish',
    {
      method: 'POST',
      body: webauthnFinishBody(req),
    }
  )
}

export async function getBackendAccounts(): Promise<BackendAccountsResponse> {
  return await jsonFetch<BackendAccountsResponse>('/api/accounts', { method: 'GET' })
}

export async function setBackendActiveAccount(args: {
  smartAccountAddress: string
}): Promise<{ ok: true }> {
  return await jsonFetch<{ ok: true }>('/api/accounts/set-active', {
    method: 'POST',
    body: JSON.stringify(args),
  })
}

export async function buildSendTx(req: BuildSendTxRequest): Promise<BuildSendTxResponse> {
  return await jsonFetch<BuildSendTxResponse>('/api/transaction/build-send', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function setupSendRules(req: SetupSendRulesRequest): Promise<SetupSendRulesResponse> {
  return await jsonFetch<SetupSendRulesResponse>('/api/smart-account/setup-send-rules', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function buildTx(req: BuildTxRequest): Promise<BuildTxResponse> {
  return await jsonFetch<BuildTxResponse>('/api/transaction/build', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function buildDelegatedTx(
  req: BuildDelegatedTxRequest
): Promise<BuildDelegatedTxResponse> {
  return await jsonFetch<BuildDelegatedTxResponse>('/api/transaction/build-delegated', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function submitTxPhantom(req: SubmitPhantomTxRequest): Promise<SubmitTxResponse> {
  return await jsonFetch<SubmitTxResponse>('/api/transaction/submit', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function submitTxDelegated(req: SubmitDelegatedTxRequest): Promise<SubmitTxResponse> {
  return await jsonFetch<SubmitTxResponse>('/api/transaction/submit-delegated', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function submitTxWebauthn(req: SubmitWebauthnTxRequest): Promise<SubmitTxResponse> {
  return await jsonFetch<SubmitTxResponse>('/api/transaction/submit-webauthn', {
    method: 'POST',
    body: webauthnFinishBody(req),
  })
}

export async function prepareSign(req: PrepareSignRequest): Promise<PrepareSignResponse> {
  return await jsonFetch<PrepareSignResponse>('/api/transaction/prepare-sign', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function fetchSignPayload(payloadRef: string): Promise<SignPayloadStoreResponse> {
  const ref = encodeURIComponent(payloadRef)
  return await jsonFetch<SignPayloadStoreResponse>(`/api/sign-payload/${ref}`, {
    method: 'GET',
  })
}
