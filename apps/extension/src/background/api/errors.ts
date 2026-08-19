export function parseApiError(status: number, data: unknown): { message: string; code?: string } {
  if (!data || typeof data !== 'object') {
    return { message: `Request failed: ${status}` }
  }

  const body = data as Record<string, unknown>

  // v1 nested: { error: { code, message } }
  if (body.error && typeof body.error === 'object' && body.error !== null) {
    const nested = body.error as Record<string, unknown>
    const message =
      typeof nested.message === 'string' ? nested.message : `Request failed: ${status}`
    const code = typeof nested.code === 'string' ? nested.code : undefined
    return { message, code }
  }

  // webapp flat: { error, message, code }
  const message =
    (typeof body.error === 'string' ? body.error : undefined) ??
    (typeof body.message === 'string' ? body.message : undefined) ??
    `Request failed: ${status}`
  const code = typeof body.code === 'string' ? body.code : undefined
  return { message, code }
}
