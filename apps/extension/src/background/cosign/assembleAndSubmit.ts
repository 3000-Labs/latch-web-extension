import type { CosignRequest } from '@latch/types'
import { Transaction, xdr } from '@stellar/stellar-sdk'

import { createRpcServer, simulateAndAssembleSoroban, sendAndPollSoroban } from '@latch/stellar'
import { markCosignSubmitted } from '../api/cosign/cosignQueue'
import { submitTxWebauthn } from '../api/transactions'
import { networkPassphraseFromEnv, sorobanRpcUrlFromEnv } from '../migration/env'

function networkPassphrase(): string {
  return networkPassphraseFromEnv()
}

function rpcUrl(): string {
  return sorobanRpcUrlFromEnv()
}

function transactionFromXdr(xdrB64: string): Transaction {
  const envelope = xdr.TransactionEnvelope.fromXDR(xdrB64, 'base64')
  return new Transaction(envelope, networkPassphrase())
}

/**
 * Merge cosign partial auth entries into the unsigned transaction envelope.
 */
export function mergeCosignAuthEntries(unsignedTxXdr: string, authEntryXdrs: string[]): string {
  const envelope = xdr.TransactionEnvelope.fromXDR(unsignedTxXdr, 'base64')
  const v1 = envelope.v1()
  if (!v1) throw new Error('Expected v1 transaction envelope')

  const txInner = v1.tx()
  const ext = txInner.ext()
  if (ext.switch() !== 1) throw new Error('Expected Soroban transaction extension')

  const sorobanData = ext.sorobanData()
  const signedEntries = authEntryXdrs.map((b64) =>
    xdr.SorobanAuthorizationEntry.fromXDR(b64, 'base64')
  )
  sorobanData.auth(signedEntries.length > 0 ? signedEntries : sorobanData.auth())

  return new Transaction(envelope, networkPassphrase()).toXDR('base64')
}

export async function assembleAndSubmitCosignRequest(args: {
  walletRef: string
  request: CosignRequest
  keyDataHex?: string
  contextRuleId?: number
}): Promise<{ txHash: string }> {
  const authXdrs = (args.request.signatures ?? []).map((s) => s.auth_entry_xdr).filter(Boolean)
  if (authXdrs.length < args.request.threshold) {
    throw new Error('Threshold not met for execution')
  }

  const mergedXdr = mergeCosignAuthEntries(args.request.unsigned_tx_xdr, authXdrs)
  const server = createRpcServer(rpcUrl())
  const tx = transactionFromXdr(mergedXdr)
  const assembled = await simulateAndAssembleSoroban(server, tx)

  let txHash: string

  if (args.keyDataHex?.trim()) {
    const smartIdx = 0
    const authEntries =
      assembled.toEnvelope().v1()?.tx().ext().sorobanData().auth() ?? []
    const authEntriesXdr = authEntries.map((entry: xdr.SorobanAuthorizationEntry) =>
      entry.toXDR('base64')
    )
    const submit = await submitTxWebauthn({
      txXdr: assembled.toXDR('base64'),
      authEntryXdr: authEntriesXdr[smartIdx] ?? authXdrs[0]!,
      sigDataXdr: '',
      keyDataHex: args.keyDataHex,
      contextRuleId: args.contextRuleId ?? 0,
      authEntriesXdr,
      smartAccountAuthEntryIndex: smartIdx,
    })
    txHash = String(submit.transactionHash ?? submit.hash ?? '')
    if (!txHash) throw new Error('Submit did not return transaction hash')
  } else {
    const send = await sendAndPollSoroban(server, assembled)
    if (send.status !== 'SUCCESS') throw new Error(send.error ?? 'On-chain submit failed')
    txHash = send.hash
  }

  await markCosignSubmitted(args.walletRef, args.request.id, txHash)
  return { txHash }
}

export function cosignRequestNeedsMySignature(
  request: CosignRequest,
  blindSignerId: string | undefined
): boolean {
  if (!blindSignerId || request.status === 'submitted' || request.status === 'cancelled') {
    return false
  }
  return !(request.signatures ?? []).some((s) => s.blind_signer_id === blindSignerId)
}
