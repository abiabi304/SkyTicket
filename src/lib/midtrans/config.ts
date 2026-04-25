import midtransClient from 'midtrans-client'

/**
 * Midtrans mode is determined SOLELY by MIDTRANS_IS_PRODUCTION env var.
 * NODE_ENV is irrelevant — Vercel sets NODE_ENV=production for all deployments,
 * but we may still want sandbox mode in production deployments.
 */
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'

export function createSnapClient() {
  return new midtransClient.Snap({
    isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
  })
}

