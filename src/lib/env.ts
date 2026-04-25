/**
 * Runtime environment variable validation.
 * Import this in layout.tsx to fail fast on missing vars.
 */

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Validate on import (server-side only)
if (typeof window === 'undefined') {
  requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  requireEnv('MIDTRANS_SERVER_KEY')
  requireEnv('NEXT_PUBLIC_MIDTRANS_CLIENT_KEY')
  requireEnv('NEXT_PUBLIC_APP_URL')
  requireEnv('UPSTASH_REDIS_REST_URL')
  requireEnv('UPSTASH_REDIS_REST_TOKEN')
}
