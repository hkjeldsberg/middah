import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  _client = createClient(url, key)
  return _client
}

// Convenience proxy so callers can use `supabaseServer.from(...)` without calling the function
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseServer()[prop as keyof SupabaseClient]
  },
})
