import { describe, expect, it } from 'vitest'

import type { StoredAccount } from '@latch/types'

import { buildCreateSendProposalRequest, proposalSummaryFromRow } from './multisigProposal'
import type { SendDraft } from '../types/send'

describe('buildCreateSendProposalRequest', () => {
  const multisigAccount: StoredAccount = {
    id: 'ms1',
    mode: 'multisig',
    smartAccountAddress: 'CBY4TTIDC3WY2WCEMT2M35M6W6SYW33LES4JAX2XLLZHZCN3LOWGHMZS',
    createdAt: 0,
  }

  const xlmDraft: SendDraft = {
    token: {
      code: 'XLM',
      sacContractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      assetId: 'native',
      amount: '5',
    },
    recipientAddress: 'CAN4WMQCBD2UY5E37VCTFA3YNOOHMLNX4JN3T4DQKKMMNBJBY57DNGNF',
    amount: '5',
    inputMode: 'crypto',
  }

  it('uses sac_transfer with tokenContractId for send proposals', () => {
    const req = buildCreateSendProposalRequest(xlmDraft, multisigAccount, null)
    expect(req).toEqual({
      smartAccountAddress: multisigAccount.smartAccountAddress,
      operationKind: 'sac_transfer',
      recipient: xlmDraft.recipientAddress,
      amount: '5',
      assetId: 'native',
      tokenContractId: xlmDraft.token!.sacContractId,
      requireMatchedContextRule: false,
    })
  })

  it('summarizes sac_transfer proposals like sends', () => {
    expect(
      proposalSummaryFromRow({
        operationKind: 'sac_transfer',
        amount: '5',
        assetId: 'native',
        recipient: 'CAN4WMQCBD2UY5E37VCTFA3YNOOHMLNX4JN3T4DQKKMMNBJBY57DNGNF',
      })
    ).toContain('Send 5 native')
  })
})
