/**
 * Node's fetch (undici) keeps connections alive in a pool. Supabase closes idle
 * connections on its side, so a request can pick a socket that is already gone
 * and die with EPIPE / "other side closed" before anything reaches the server.
 * These are safe to retry — the request never landed.
 */
const TRANSIENT = /EPIPE|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|UND_ERR_SOCKET|other side closed|fetch failed|socket hang up|network|terminated/i

function isTransient(err: unknown): boolean {
  if (!err) return false

  // Walk the cause chain — undici hides the real reason a few levels down.
  let current: unknown = err
  for (let depth = 0; current && depth < 5; depth++) {
    const e = current as { message?: string; code?: string; name?: string; cause?: unknown; originalError?: unknown }
    const haystack = [e.code, e.name, e.message].filter(Boolean).join(' ')
    if (TRANSIENT.test(haystack)) return true
    current = e.cause ?? e.originalError
  }
  return false
}

/**
 * Runs `fn`, retrying transient network failures with a short backoff.
 * `fn` must be idempotent — every caller here either overwrites a fixed storage
 * path or performs the same UPDATE, so a duplicate attempt is harmless.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 300, label = 'request' }: {
    attempts?: number
    baseDelayMs?: number
    label?: string
  } = {}
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === attempts || !isTransient(err)) throw err
      const delay = baseDelayMs * attempt
      console.warn(
        `[retry] ${label} feilet (forsøk ${attempt}/${attempts}), prøver igjen om ${delay}ms:`,
        (err as Error).message
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Same, for Supabase calls that resolve with `{ error }` instead of throwing.
 * A transient `error` is turned into a throw so `withRetry` can see it.
 */
export async function withRetryResult<T extends { error: unknown }>(
  fn: () => Promise<T>,
  options?: { attempts?: number; baseDelayMs?: number; label?: string }
): Promise<T> {
  return withRetry(async () => {
    const result = await fn()
    if (result.error && isTransient(result.error)) throw result.error
    return result
  }, options)
}
