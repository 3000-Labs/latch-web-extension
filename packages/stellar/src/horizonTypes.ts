/**
 * Narrow shapes for Horizon `GET /accounts/{id}` JSON used by migration.
 * @see https://developers.stellar.org/api/horizon/resources/get-account-by-account-id
 */

export interface HorizonNativeBalanceLine {
  asset_type: 'native'
  balance: string
}

export interface HorizonCreditBalanceLine {
  asset_type: 'credit_alphanum4' | 'credit_alphanum12'
  asset_code: string
  asset_issuer: string
  balance: string
}

export type HorizonBalanceLine = HorizonNativeBalanceLine | HorizonCreditBalanceLine

export interface HorizonAccountRecord {
  id: string
  sequence: string
  subentry_count?: number
  balances: HorizonBalanceLine[]
}

export function isHorizonCreditBalance(b: HorizonBalanceLine): b is HorizonCreditBalanceLine {
  return b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12'
}
