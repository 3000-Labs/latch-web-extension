import { Account, Asset, Operation, Transaction, TransactionBuilder } from '@stellar/stellar-sdk'

export function buildClassicNativePaymentTx(params: {
  sourceAccount: Account
  destination: string
  /** Payment amount as decimal string (7 fraction digits typical for XLM) */
  amount: string
  networkPassphrase: string
  /** Base fee in stroops */
  fee: string
}): Transaction {
  return new TransactionBuilder(params.sourceAccount, {
    fee: params.fee,
    networkPassphrase: params.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: params.destination,
        asset: Asset.native(),
        amount: params.amount,
      }),
    )
    .setTimeout(300)
    .build()
}
