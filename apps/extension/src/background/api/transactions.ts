import type {
  BuildDelegatedTxRequest,
  BuildDelegatedTxResponse,
  BuildSendTxRequest,
  BuildSendTxResponse,
  BuildSwapTxRequest,
  BuildSwapTxResponse,
  BuildTxRequest,
  BuildTxResponse,
  PrepareSignRequest,
  PrepareSignResponse,
  SetupSendRulesRequest,
  SetupSendRulesResponse,
  SetupSwapRulesRequest,
  SetupSwapRulesResponse,
  SubmitDelegatedTxRequest,
  SubmitPhantomTxRequest,
  SubmitTxResponse,
  SubmitWebauthnTxRequest,
} from '@latch/types'

import { latchFetch } from './client'
import { latchExtensionJsonBody } from './webauthn'

export async function buildSendTx(req: BuildSendTxRequest): Promise<BuildSendTxResponse> {
  return await latchFetch<BuildSendTxResponse>('/api/transaction/build-send', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function buildSwapTx(req: BuildSwapTxRequest): Promise<BuildSwapTxResponse> {
  return await latchFetch<BuildSwapTxResponse>('/api/transaction/build-swap', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function setupSendRules(req: SetupSendRulesRequest): Promise<SetupSendRulesResponse> {
  return await latchFetch<SetupSendRulesResponse>('/api/smart-account/setup-send-rules', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function setupSwapRules(req: SetupSwapRulesRequest): Promise<SetupSwapRulesResponse> {
  return await latchFetch<SetupSwapRulesResponse>('/api/smart-account/setup-swap-rules', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function buildTx(req: BuildTxRequest): Promise<BuildTxResponse> {
  return await latchFetch<BuildTxResponse>('/api/transaction/build', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function buildDelegatedTx(
  req: BuildDelegatedTxRequest
): Promise<BuildDelegatedTxResponse> {
  return await latchFetch<BuildDelegatedTxResponse>('/api/transaction/build-delegated', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function submitTxPhantom(req: SubmitPhantomTxRequest): Promise<SubmitTxResponse> {
  return await latchFetch<SubmitTxResponse>('/api/transaction/submit', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function submitTxDelegated(req: SubmitDelegatedTxRequest): Promise<SubmitTxResponse> {
  return await latchFetch<SubmitTxResponse>('/api/transaction/submit-delegated', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function submitTxWebauthn(req: SubmitWebauthnTxRequest): Promise<SubmitTxResponse> {
  return await latchFetch<SubmitTxResponse>('/api/transaction/submit-webauthn', {
    method: 'POST',
    body: latchExtensionJsonBody(req),
  })
}

export async function prepareSign(req: PrepareSignRequest): Promise<PrepareSignResponse> {
  return await latchFetch<PrepareSignResponse>('/api/transaction/prepare-sign', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}
