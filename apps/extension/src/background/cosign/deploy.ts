import type { StoredAccount } from '@latch/types'

import { deployMultisigAccount } from '../api/multisigAccounts'
import { generateWCK } from './crypto'
import { announceMemberForWallet } from './membership'
import { ensureDeviceTransportKeyPair } from './keyStorage'
import { exportRawPublicKey, deriveBlindSignerId, deriveMemberBlindId, toBase64 } from './crypto'
import { signerPublicKeyBytesForAccount } from './signerBytes'
import {
  newCosignWalletRecordId,
  saveCosignWalletRecord,
  wckHexFromBytes,
} from './wckStorage'
import { createAccount } from '../storage'

export async function deployCosignMultisigWallet(args: {
  threshold: number
  signers: import('@latch/types').MultisigSignerInitRequest[]
  accountSaltHex: string
  walletName: string
  inviteToken: string
  creatorLinkedAccount: StoredAccount
}): Promise<{
  smartAccountAddress: string
  accountSaltHex: string
  wckRecordId: string
  account: StoredAccount
}> {
  const deployed = await deployMultisigAccount({
    threshold: args.threshold,
    signers: args.signers,
    accountSaltHex: args.accountSaltHex,
  })
  const smartAccountAddress = deployed.smartAccountAddress?.trim()
  if (!smartAccountAddress) throw new Error('Deploy did not return smart account address')

  const wck = generateWCK()
  const wckHex = wckHexFromBytes(wck)
  const recordId = newCosignWalletRecordId()

  const creatorSignerBytes = await signerPublicKeyBytesForAccount(args.creatorLinkedAccount)
  const creatorBlindId = await deriveMemberBlindId(creatorSignerBytes)
  const creatorBlindSignerId = await deriveBlindSignerId(wck, creatorSignerBytes)

  const transport = await ensureDeviceTransportKeyPair()
  const transportB64 = toBase64(await exportRawPublicKey(transport.publicKey))

  await saveCosignWalletRecord({
    id: recordId,
    walletRef: smartAccountAddress,
    wckHex,
    threshold: args.threshold,
    label: args.walletName,
    linkedSignerAccountId: args.creatorLinkedAccount.id,
    accountSaltHex: deployed.accountSaltHex ?? args.accountSaltHex,
    membersSnapshot: args.signers.map((s) => ({ ...s })),
    createdAt: Date.now(),
  })

  await announceMemberForWallet({
    walletRef: smartAccountAddress,
    wckHex,
    memberBlindIds: [creatorBlindId],
    transportPubkeyB64: transportB64,
  })

  const { account } = await createAccount({
    mode: 'multisig',
    smartAccountAddress,
    label: args.walletName,
    multisigThreshold: args.threshold,
    cosignWckRefId: recordId,
    cosignBlindSignerId: creatorBlindSignerId,
    cosignLinkedAccountId: args.creatorLinkedAccount.id,
    multisigAccountSaltHex: deployed.accountSaltHex ?? args.accountSaltHex,
    multisigMembersSnapshot: args.signers.map((s) => ({ ...s })),
  })

  return {
    smartAccountAddress,
    accountSaltHex: deployed.accountSaltHex ?? args.accountSaltHex,
    wckRecordId: recordId,
    account,
  }
}
