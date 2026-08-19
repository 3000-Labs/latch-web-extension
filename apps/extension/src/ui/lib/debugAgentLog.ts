/** Temporary debug-session logger (session dcd3f5). Remove after verification. */

type DebugPayload = {
  sessionId: string
  runId: string
  hypothesisId: string
  location: string
  message: string
  data: Record<string, unknown>
  timestamp: number
}

function postPayload(payload: DebugPayload): void {
  const body = JSON.stringify(payload)
  // #region agent log
  // text/plain avoids CORS preflight from chrome-extension:// pages
  const headers = {
    'Content-Type': 'text/plain',
    'X-Debug-Session-Id': 'dcd3f5',
  }
  fetch('http://127.0.0.1:7938/ingest/951b3e3a-2219-4f26-8a98-553fa3269d5e', {
    method: 'POST',
    headers,
    body,
    mode: 'cors',
    keepalive: true,
  }).catch(() => {})
  fetch('http://localhost:8000/latch-debug-dcd3f5', {
    method: 'POST',
    headers,
    body,
    mode: 'cors',
    keepalive: true,
  }).catch(() => {})
  // #endregion
}

export function debugAgentLog(args: {
  hypothesisId: string
  location: string
  message: string
  data?: Record<string, unknown>
  runId?: string
}): void {
  const payload: DebugPayload = {
    sessionId: 'dcd3f5',
    runId: args.runId ?? 'pre-fix',
    hypothesisId: args.hypothesisId,
    location: args.location,
    message: args.message,
    data: args.data ?? {},
    timestamp: Date.now(),
  }
  postPayload(payload)
  try {
    void chrome.runtime.sendMessage({ type: 'DEBUG_AGENT_LOG', payload })
  } catch {
    // ignore
  }
  try {
    void chrome.storage.local.get('latch.debugDcd3f5Logs').then((bag) => {
      const prev = Array.isArray(bag?.['latch.debugDcd3f5Logs'])
        ? (bag['latch.debugDcd3f5Logs'] as unknown[])
        : []
      const next = [...prev, payload].slice(-80)
      void chrome.storage.local.set({ 'latch.debugDcd3f5Logs': next })
    })
  } catch {
    // ignore
  }
}
