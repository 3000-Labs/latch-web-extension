import {
  Account,
  Address,
  Contract,
  nativeToScVal,
  Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk'

export function buildUnsignedSacTransferTx(params: {
  sourceAccount: Account
  sacContractId: string
  fromGAddress: string
  toCAddress: string
  /** Raw token amount in stroops/smallest units (i128) */
  amountRaw: bigint
  networkPassphrase: string
  /** Base fee in stroops (may be replaced after simulation) */
  fee: string
}): Transaction {
  const contract = new Contract(params.sacContractId)
  return new TransactionBuilder(params.sourceAccount, {
    fee: params.fee,
    networkPassphrase: params.networkPassphrase,
  })
    .addOperation(
      contract.call(
        'transfer',
        new Address(params.fromGAddress).toScVal(),
        new Address(params.toCAddress).toScVal(),
        nativeToScVal(params.amountRaw, { type: 'i128' }),
      ),
    )
    .setTimeout(300)
    .build()
}
