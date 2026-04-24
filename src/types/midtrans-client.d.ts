/* eslint-disable @typescript-eslint/no-unused-vars */
declare module 'midtrans-client' {
  interface MidtransConfig {
    isProduction: boolean
    serverKey: string
    clientKey: string
  }

  interface TransactionDetails {
    order_id: string
    gross_amount: number
  }

  interface CustomerDetails {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
  }

  interface ItemDetail {
    id: string
    price: number
    quantity: number
    name: string
  }

  interface SnapParameter {
    transaction_details: TransactionDetails
    customer_details?: CustomerDetails
    item_details?: ItemDetail[]
    callbacks?: {
      finish?: string
      error?: string
      pending?: string
    }
  }

  interface SnapTransaction {
    token: string
    redirect_url: string
  }

  interface ChargeParameter {
    payment_type: string
    transaction_details: TransactionDetails
    customer_details?: CustomerDetails
    item_details?: ItemDetail[]
    bank_transfer?: {
      bank: string
      va_number?: string
    }
    echannel?: {
      bill_info1: string
      bill_info2: string
    }
    gopay?: {
      enable_callback?: boolean
      callback_url?: string
    }
    shopeepay?: {
      callback_url?: string
    }
    qris?: {
      acquirer?: string
    }
    custom_expiry?: {
      expiry_duration: number
      unit: string
    }
  }

  interface ChargeResponse {
    status_code: string
    status_message: string
    transaction_id: string
    order_id: string
    gross_amount: string
    payment_type: string
    transaction_time: string
    transaction_status: string
    fraud_status?: string
    va_numbers?: Array<{ bank: string; va_number: string }>
    permata_va_number?: string
    bill_key?: string
    biller_code?: string
    actions?: Array<{ name: string; method: string; url: string }>
    qr_string?: string
  }

  class Snap {
    constructor(config: MidtransConfig)
    createTransaction(parameter: SnapParameter): Promise<SnapTransaction>
  }

  class CoreApi {
    constructor(config: MidtransConfig)
    charge(parameter: ChargeParameter): Promise<ChargeResponse>
    transaction: {
      status(orderId: string): Promise<ChargeResponse>
      cancel(orderId: string): Promise<ChargeResponse>
    }
  }

  const midtransClient: {
    Snap: typeof Snap
    CoreApi: typeof CoreApi
  }

  export = midtransClient
}
