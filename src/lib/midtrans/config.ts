import midtransClient from 'midtrans-client'

const isProduction = process.env.NODE_ENV === 'production' && process.env.MIDTRANS_IS_PRODUCTION === 'true'

export function createSnapClient() {
  return new midtransClient.Snap({
    isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
  })
}

export function createCoreApiClient() {
  return new midtransClient.CoreApi({
    isProduction,
    serverKey: process.env.MIDTRANS_SERVER_KEY!,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
  })
}

export const MIDTRANS_SNAP_URL = isProduction
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js'
