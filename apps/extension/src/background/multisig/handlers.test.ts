import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  CreateMultisigAccountParams,
  CreateMultisigProposalRequest,
  MultisigApproveDelegatedFinishRequest,
  MultisigApproveWebauthnRequest,
  MultisigDraftMemberRequest,
  MultisigDraftMeta,
  MultisigPendingInvite,
  RegisterMultisigAccountRequest,
} from '@latch/types'

const createMultisigDraft = vi.fn()
const getActiveMultisigDraft = vi.fn()
const addMultisigDraftMember = vi.fn()
const removeMultisigDraftMember = vi.fn()
const updateMultisigDraftThreshold = vi.fn()
const predictMultisigDraftAddress = vi.fn()
const deployMultisigDraft = vi.fn()
const multisigDraftPasskeyRegBegin = vi.fn()
const multisigDraftPasskeyRegFinish = vi.fn()
const multisigDraftPasskeyAuthBegin = vi.fn()
const multisigDraftPasskeyAuthFinish = vi.fn()
const listMultisigAccounts = vi.fn()
const registerMultisigAccount = vi.fn()
const getMultisigDraftByInviteToken = vi.fn()
const joinMultisigDraft = vi.fn()
const multisigJoinPasskeyRegBegin = vi.fn()
const multisigJoinPasskeyRegFinish = vi.fn()
const multisigJoinPasskeyAuthBegin = vi.fn()
const multisigJoinPasskeyAuthFinish = vi.fn()
const listMultisigProposals = vi.fn()
const getMultisigProposal = vi.fn()
const createMultisigProposal = vi.fn()
const multisigProposalApproveDelegatedBegin = vi.fn()
const multisigProposalApproveDelegatedFinish = vi.fn()
const multisigProposalApproveWebauthn = vi.fn()
const executeMultisigProposal = vi.fn()
const refreshMultisigProposal = vi.fn()

vi.mock('../backend', () => ({
  createMultisigDraft: (...args: unknown[]) => createMultisigDraft(...args),
  getActiveMultisigDraft: (...args: unknown[]) => getActiveMultisigDraft(...args),
  addMultisigDraftMember: (...args: unknown[]) => addMultisigDraftMember(...args),
  removeMultisigDraftMember: (...args: unknown[]) => removeMultisigDraftMember(...args),
  updateMultisigDraftThreshold: (...args: unknown[]) => updateMultisigDraftThreshold(...args),
  predictMultisigDraftAddress: (...args: unknown[]) => predictMultisigDraftAddress(...args),
  deployMultisigDraft: (...args: unknown[]) => deployMultisigDraft(...args),
  multisigDraftPasskeyRegBegin: (...args: unknown[]) => multisigDraftPasskeyRegBegin(...args),
  multisigDraftPasskeyRegFinish: (...args: unknown[]) => multisigDraftPasskeyRegFinish(...args),
  multisigDraftPasskeyAuthBegin: (...args: unknown[]) => multisigDraftPasskeyAuthBegin(...args),
  multisigDraftPasskeyAuthFinish: (...args: unknown[]) => multisigDraftPasskeyAuthFinish(...args),
  listMultisigAccounts: (...args: unknown[]) => listMultisigAccounts(...args),
  registerMultisigAccount: (...args: unknown[]) => registerMultisigAccount(...args),
  getMultisigDraftByInviteToken: (...args: unknown[]) => getMultisigDraftByInviteToken(...args),
  joinMultisigDraft: (...args: unknown[]) => joinMultisigDraft(...args),
  multisigJoinPasskeyRegBegin: (...args: unknown[]) => multisigJoinPasskeyRegBegin(...args),
  multisigJoinPasskeyRegFinish: (...args: unknown[]) => multisigJoinPasskeyRegFinish(...args),
  multisigJoinPasskeyAuthBegin: (...args: unknown[]) => multisigJoinPasskeyAuthBegin(...args),
  multisigJoinPasskeyAuthFinish: (...args: unknown[]) => multisigJoinPasskeyAuthFinish(...args),
  listMultisigProposals: (...args: unknown[]) => listMultisigProposals(...args),
  getMultisigProposal: (...args: unknown[]) => getMultisigProposal(...args),
  createMultisigProposal: (...args: unknown[]) => createMultisigProposal(...args),
  multisigProposalApproveDelegatedBegin: (...args: unknown[]) =>
    multisigProposalApproveDelegatedBegin(...args),
  multisigProposalApproveDelegatedFinish: (...args: unknown[]) =>
    multisigProposalApproveDelegatedFinish(...args),
  multisigProposalApproveWebauthn: (...args: unknown[]) => multisigProposalApproveWebauthn(...args),
  executeMultisigProposal: (...args: unknown[]) => executeMultisigProposal(...args),
  refreshMultisigProposal: (...args: unknown[]) => refreshMultisigProposal(...args),
}))

const addMultisigPendingInvite = vi.fn()
const clearMultisigDraftMeta = vi.fn()
const createMultisigAccount = vi.fn()
const dismissMultisigProposalsBanner = vi.fn()
const getMultisigDraftMeta = vi.fn()
const getMultisigPendingInvites = vi.fn()
const getMultisigProposalsBannerDismissed = vi.fn()
const removeMultisigPendingInvite = vi.fn()
const setMultisigDraftMeta = vi.fn()

vi.mock('../storage', () => ({
  addMultisigPendingInvite: (...args: unknown[]) => addMultisigPendingInvite(...args),
  clearMultisigDraftMeta: (...args: unknown[]) => clearMultisigDraftMeta(...args),
  createMultisigAccount: (...args: unknown[]) => createMultisigAccount(...args),
  dismissMultisigProposalsBanner: (...args: unknown[]) => dismissMultisigProposalsBanner(...args),
  getMultisigDraftMeta: (...args: unknown[]) => getMultisigDraftMeta(...args),
  getMultisigPendingInvites: (...args: unknown[]) => getMultisigPendingInvites(...args),
  getMultisigProposalsBannerDismissed: (...args: unknown[]) =>
    getMultisigProposalsBannerDismissed(...args),
  removeMultisigPendingInvite: (...args: unknown[]) => removeMultisigPendingInvite(...args),
  setMultisigDraftMeta: (...args: unknown[]) => setMultisigDraftMeta(...args),
}))

const ensureMultisigAccountRegisteredForSession = vi.fn()
const syncLocalMultisigAccountsFromBackend = vi.fn()

vi.mock('./syncLocalAccounts', () => ({
  ensureMultisigAccountRegisteredForSession: (...args: unknown[]) =>
    ensureMultisigAccountRegisteredForSession(...args),
  syncLocalMultisigAccountsFromBackend: (...args: unknown[]) =>
    syncLocalMultisigAccountsFromBackend(...args),
}))

import { tryHandleMultisigMessage } from './handlers'

const ok = <T>(data?: T) => ({ ok: true as const, data })

describe('tryHandleMultisigMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false for unrecognized message types', async () => {
    const sendResponse = vi.fn()
    const handled = await tryHandleMultisigMessage(
      { type: 'NOT_A_MULTISIG_MESSAGE' as never, payload: undefined },
      sendResponse,
      ok
    )
    expect(handled).toBe(false)
    expect(sendResponse).not.toHaveBeenCalled()
  })

  describe('draft creation and management', () => {
    it('handles MULTISIG_CREATE_DRAFT', async () => {
      const draftResp = { draft: { id: 'draft-1' }, inviteToken: 'invite-1' }
      createMultisigDraft.mockResolvedValue(draftResp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_CREATE_DRAFT' },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(createMultisigDraft).toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(ok(draftResp))
    })

    it('handles MULTISIG_GET_ACTIVE_DRAFT', async () => {
      const draftResp = { draft: { id: 'draft-1', status: 'active' } }
      getActiveMultisigDraft.mockResolvedValue(draftResp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_GET_ACTIVE_DRAFT' },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(getActiveMultisigDraft).toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(ok(draftResp))
    })

    it('handles MULTISIG_ADD_DRAFT_MEMBER with correct payload', async () => {
      const member: MultisigDraftMemberRequest = {
        label: 'Alice',
        memberType: 'passkey',
        keyDataHex: 'abcd',
      }
      const req = { draftId: 'draft-1', member }
      const resp = { id: 'member-1', ...member }
      addMultisigDraftMember.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_ADD_DRAFT_MEMBER', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(addMultisigDraftMember).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_REMOVE_DRAFT_MEMBER', async () => {
      const req = { draftId: 'draft-1', memberId: 'member-1' }
      const resp = { ok: true }
      removeMultisigDraftMember.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_REMOVE_DRAFT_MEMBER', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(removeMultisigDraftMember).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_UPDATE_DRAFT_THRESHOLD', async () => {
      const req = { draftId: 'draft-1', threshold: 2 }
      const resp = { threshold: 2 }
      updateMultisigDraftThreshold.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_UPDATE_DRAFT_THRESHOLD', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(updateMultisigDraftThreshold).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_PREDICT_DRAFT', async () => {
      const req = { draftId: 'draft-1' }
      const resp = { smartAccountAddress: 'CPREDICTED', accountSaltHex: 'aaaa' }
      predictMultisigDraftAddress.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_PREDICT_DRAFT', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(predictMultisigDraftAddress).toHaveBeenCalledWith('draft-1')
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_DEPLOY_DRAFT', async () => {
      const req = { draftId: 'draft-1' }
      const resp = { smartAccountAddress: 'CDEPLOYED', transactionHash: 'hash-1' }
      deployMultisigDraft.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_DEPLOY_DRAFT', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(deployMultisigDraft).toHaveBeenCalledWith('draft-1')
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })
  })

  describe('draft passkey flows', () => {
    it('handles MULTISIG_DRAFT_PASSKEY_REG_BEGIN', async () => {
      const req = { draftId: 'draft-1', displayName: 'My Passkey' }
      const resp = { publicKeyCredentialCreationOptions: {} }
      multisigDraftPasskeyRegBegin.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_DRAFT_PASSKEY_REG_BEGIN', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigDraftPasskeyRegBegin).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_DRAFT_PASSKEY_REG_FINISH', async () => {
      const req = { draftId: 'draft-1', response: { id: 'cred-1' } }
      const resp = { credentialId: 'cred-1', keyDataHex: 'aaaa' }
      multisigDraftPasskeyRegFinish.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_DRAFT_PASSKEY_REG_FINISH', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigDraftPasskeyRegFinish).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_DRAFT_PASSKEY_AUTH_BEGIN', async () => {
      const req = { draftId: 'draft-1' }
      const resp = { publicKeyCredentialRequestOptions: {} }
      multisigDraftPasskeyAuthBegin.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_DRAFT_PASSKEY_AUTH_BEGIN', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigDraftPasskeyAuthBegin).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_DRAFT_PASSKEY_AUTH_FINISH', async () => {
      const req = { draftId: 'draft-1', response: { id: 'cred-1' } }
      const resp = { token: 'session-1' }
      multisigDraftPasskeyAuthFinish.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_DRAFT_PASSKEY_AUTH_FINISH', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigDraftPasskeyAuthFinish).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })
  })

  describe('accounts list and register', () => {
    it('handles MULTISIG_LIST_ACCOUNTS', async () => {
      const accounts = [{ smartAccountAddress: 'CMULTI1' }, { smartAccountAddress: 'CMULTI2' }]
      listMultisigAccounts.mockResolvedValue({ accounts })

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_LIST_ACCOUNTS' },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(listMultisigAccounts).toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(ok({ accounts }))
    })

    it('handles MULTISIG_REGISTER_ACCOUNT', async () => {
      const req: RegisterMultisigAccountRequest = {
        smartAccountAddress: 'CNEW',
        threshold: 2,
        accountSaltHex: 'aaaa',
        members: [{ type: 'webauthn', keyDataHex: 'abcd' }],
      }
      const resp = { id: 'backend-1' }
      registerMultisigAccount.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_REGISTER_ACCOUNT', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(registerMultisigAccount).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })
  })

  describe('join flow', () => {
    it('handles MULTISIG_JOIN_PREVIEW', async () => {
      const req = { token: 'join-token' }
      const resp = { draft: { id: 'draft-1', threshold: 2 } }
      getMultisigDraftByInviteToken.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_JOIN_PREVIEW', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(getMultisigDraftByInviteToken).toHaveBeenCalledWith('join-token')
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_JOIN_MEMBER', async () => {
      const member: MultisigDraftMemberRequest = {
        label: 'Bob',
        memberType: 'passkey',
        keyDataHex: 'bbbb',
      }
      const req = { token: 'join-token', member }
      const resp = { memberId: 'member-2' }
      joinMultisigDraft.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_JOIN_MEMBER', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(joinMultisigDraft).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_JOIN_PASSKEY_REG_BEGIN', async () => {
      const req = { token: 'join-token', displayName: 'Bob Key' }
      const resp = { publicKeyCredentialCreationOptions: {} }
      multisigJoinPasskeyRegBegin.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_JOIN_PASSKEY_REG_BEGIN', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigJoinPasskeyRegBegin).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_JOIN_PASSKEY_REG_FINISH', async () => {
      const req = { token: 'join-token', response: { id: 'cred-2' } }
      const resp = { credentialId: 'cred-2', keyDataHex: 'bbbb' }
      multisigJoinPasskeyRegFinish.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_JOIN_PASSKEY_REG_FINISH', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigJoinPasskeyRegFinish).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_JOIN_PASSKEY_AUTH_BEGIN', async () => {
      const req = { token: 'join-token' }
      const resp = { publicKeyCredentialRequestOptions: {} }
      multisigJoinPasskeyAuthBegin.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_JOIN_PASSKEY_AUTH_BEGIN', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigJoinPasskeyAuthBegin).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_JOIN_PASSKEY_AUTH_FINISH', async () => {
      const req = { token: 'join-token', response: { id: 'cred-2' } }
      const resp = { token: 'join-session' }
      multisigJoinPasskeyAuthFinish.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_JOIN_PASSKEY_AUTH_FINISH', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigJoinPasskeyAuthFinish).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })
  })

  describe('proposals', () => {
    it('handles MULTISIG_LIST_PROPOSALS and ensures account registered', async () => {
      const req = { smartAccountAddress: 'CMULTI' }
      const proposals = [{ id: 'prop-1', status: 'pending' }]
      listMultisigProposals.mockResolvedValue({ proposals })

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_LIST_PROPOSALS', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(ensureMultisigAccountRegisteredForSession).toHaveBeenCalledWith('CMULTI')
      expect(listMultisigProposals).toHaveBeenCalledWith('CMULTI')
      expect(sendResponse).toHaveBeenCalledWith(ok({ proposals }))
    })

    it('handles MULTISIG_GET_PROPOSAL', async () => {
      const req = { proposalId: 'prop-1' }
      const proposal = { id: 'prop-1', status: 'pending', approvalCount: 1 }
      getMultisigProposal.mockResolvedValue(proposal)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_GET_PROPOSAL', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(getMultisigProposal).toHaveBeenCalledWith('prop-1')
      expect(sendResponse).toHaveBeenCalledWith(ok(proposal))
    })

    it('handles MULTISIG_CREATE_PROPOSAL and ensures account registered', async () => {
      const req: CreateMultisigProposalRequest = {
        smartAccountAddress: 'CMULTI',
        operationKind: 'sac_transfer',
        recipient: 'GDEST',
        amount: '100',
        assetId: 'XLM',
      }
      const resp = { id: 'prop-2', status: 'pending' }
      createMultisigProposal.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_CREATE_PROPOSAL', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(ensureMultisigAccountRegisteredForSession).toHaveBeenCalledWith('CMULTI')
      expect(createMultisigProposal).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_APPROVE_DELEGATED_BEGIN', async () => {
      const req = { proposalId: 'prop-1', memberId: 'member-1' }
      const resp = { tx: 'xxxx', authEntry: 'yyyy' }
      multisigProposalApproveDelegatedBegin.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_APPROVE_DELEGATED_BEGIN', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigProposalApproveDelegatedBegin).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_APPROVE_DELEGATED_FINISH', async () => {
      const req: MultisigApproveDelegatedFinishRequest = {
        proposalId: 'prop-1',
        memberId: 'member-1',
        signedAuthEntryBase64: 'base64signed',
        signerAddress: 'GSIGNER',
      }
      const resp = { approvalCount: 2 }
      multisigProposalApproveDelegatedFinish.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_APPROVE_DELEGATED_FINISH', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigProposalApproveDelegatedFinish).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_APPROVE_WEBAUTHN', async () => {
      const req: MultisigApproveWebauthnRequest = {
        proposalId: 'prop-1',
        memberId: 'member-1',
        sigDataXdrHex: 'deadbeef',
      }
      const resp = { approvalCount: 2 }
      multisigProposalApproveWebauthn.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_APPROVE_WEBAUTHN', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(multisigProposalApproveWebauthn).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_EXECUTE_PROPOSAL', async () => {
      const req = { proposalId: 'prop-1' }
      const resp = { transactionHash: 'hash-abc', status: 'executed' }
      executeMultisigProposal.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_EXECUTE_PROPOSAL', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(executeMultisigProposal).toHaveBeenCalledWith('prop-1')
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })

    it('handles MULTISIG_REFRESH_PROPOSAL', async () => {
      const req = { proposalId: 'prop-1' }
      const resp = { id: 'prop-1', status: 'approved', approvalCount: 2 }
      refreshMultisigProposal.mockResolvedValue(resp)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_REFRESH_PROPOSAL', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(refreshMultisigProposal).toHaveBeenCalledWith('prop-1')
      expect(sendResponse).toHaveBeenCalledWith(ok(resp))
    })
  })

  describe('local storage operations', () => {
    it('handles MULTISIG_CREATE_LOCAL_ACCOUNT', async () => {
      const req: CreateMultisigAccountParams = {
        smartAccountAddress: 'CNEWLOCAL',
        label: 'Family Wallet',
        multisigThreshold: 2,
        multisigMemberId: 'member-1',
        multisigBackendAccountId: 'backend-1',
      }
      const result = { id: 'local-acc-1' }
      createMultisigAccount.mockResolvedValue(result)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_CREATE_LOCAL_ACCOUNT', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(createMultisigAccount).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(result))
    })

    it('handles MULTISIG_GET_PENDING_INVITES', async () => {
      const invites: MultisigPendingInvite[] = [
        { token: 'tok-1', joinedAt: 1, multisigMemberId: 'member-1' },
      ]
      getMultisigPendingInvites.mockResolvedValue(invites)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_GET_PENDING_INVITES' },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(getMultisigPendingInvites).toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(ok({ invites }))
    })

    it('handles MULTISIG_ADD_PENDING_INVITE', async () => {
      const invite: MultisigPendingInvite = {
        token: 'tok-new',
        joinedAt: Date.now(),
        smartAccountAddress: 'CMULTI',
      }
      const invites: MultisigPendingInvite[] = [invite]
      addMultisigPendingInvite.mockResolvedValue(invites)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_ADD_PENDING_INVITE', payload: invite },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(addMultisigPendingInvite).toHaveBeenCalledWith(invite)
      expect(sendResponse).toHaveBeenCalledWith(ok({ invites }))
    })

    it('handles MULTISIG_REMOVE_PENDING_INVITE', async () => {
      const req = { token: 'tok-1' }
      const invites: MultisigPendingInvite[] = []
      removeMultisigPendingInvite.mockResolvedValue(invites)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_REMOVE_PENDING_INVITE', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(removeMultisigPendingInvite).toHaveBeenCalledWith('tok-1')
      expect(sendResponse).toHaveBeenCalledWith(ok({ invites }))
    })

    it('handles MULTISIG_GET_DRAFT_META', async () => {
      const meta: MultisigDraftMeta = {
        draftId: 'draft-1',
        inviteToken: 'inv-1',
        walletName: 'Team Vault',
      }
      getMultisigDraftMeta.mockResolvedValue(meta)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_GET_DRAFT_META' },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(getMultisigDraftMeta).toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(ok({ meta }))
    })

    it('handles MULTISIG_SET_DRAFT_META', async () => {
      const meta: MultisigDraftMeta = {
        draftId: 'draft-1',
        inviteToken: 'inv-1',
        walletName: 'Team Vault',
      }
      setMultisigDraftMeta.mockResolvedValue(undefined)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_SET_DRAFT_META', payload: meta },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(setMultisigDraftMeta).toHaveBeenCalledWith(meta)
      expect(sendResponse).toHaveBeenCalledWith(ok())
    })

    it('handles MULTISIG_CLEAR_DRAFT_META', async () => {
      clearMultisigDraftMeta.mockResolvedValue(undefined)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_CLEAR_DRAFT_META' },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(clearMultisigDraftMeta).toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(ok())
    })

    it('handles MULTISIG_SYNC_LOCAL_ACCOUNTS with default payload', async () => {
      const result = { synced: 2, activated: 'acc-1' }
      syncLocalMultisigAccountsFromBackend.mockResolvedValue(result)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_SYNC_LOCAL_ACCOUNTS' },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(syncLocalMultisigAccountsFromBackend).toHaveBeenCalledWith({})
      expect(sendResponse).toHaveBeenCalledWith(ok(result))
    })

    it('handles MULTISIG_SYNC_LOCAL_ACCOUNTS with activateFirstCreated flag', async () => {
      const req = { activateFirstCreated: true }
      const result = { synced: 1, activated: 'acc-new' }
      syncLocalMultisigAccountsFromBackend.mockResolvedValue(result)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_SYNC_LOCAL_ACCOUNTS', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(syncLocalMultisigAccountsFromBackend).toHaveBeenCalledWith(req)
      expect(sendResponse).toHaveBeenCalledWith(ok(result))
    })

    it('handles MULTISIG_GET_PROPOSALS_BANNER_DISMISSED', async () => {
      const accountIds = ['acc-1', 'acc-2']
      getMultisigProposalsBannerDismissed.mockResolvedValue(accountIds)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_GET_PROPOSALS_BANNER_DISMISSED' },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(getMultisigProposalsBannerDismissed).toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith(ok({ accountIds }))
    })

    it('handles MULTISIG_DISMISS_PROPOSALS_BANNER', async () => {
      const req = { accountId: 'acc-1' }
      const accountIds = ['acc-1']
      dismissMultisigProposalsBanner.mockResolvedValue(accountIds)

      const sendResponse = vi.fn()
      const handled = await tryHandleMultisigMessage(
        { type: 'MULTISIG_DISMISS_PROPOSALS_BANNER', payload: req },
        sendResponse,
        ok
      )

      expect(handled).toBe(true)
      expect(dismissMultisigProposalsBanner).toHaveBeenCalledWith('acc-1')
      expect(sendResponse).toHaveBeenCalledWith(ok({ accountIds }))
    })
  })

  describe('error propagation from backend', () => {
    it('rejects when createMultisigDraft API fails', async () => {
      const apiError = new Error('network error')
      createMultisigDraft.mockRejectedValue(apiError)

      const sendResponse = vi.fn()
      await expect(
        tryHandleMultisigMessage({ type: 'MULTISIG_CREATE_DRAFT' }, sendResponse, ok)
      ).rejects.toThrow('network error')
      expect(sendResponse).not.toHaveBeenCalled()
    })

    it('rejects when joinMultisigDraft API fails', async () => {
      const member: MultisigDraftMemberRequest = {
        label: 'Bob',
        memberType: 'passkey',
        keyDataHex: 'bbbb',
      }
      const req = { token: 'join-token', member }
      const apiError = new Error('invalid token')
      joinMultisigDraft.mockRejectedValue(apiError)

      const sendResponse = vi.fn()
      await expect(
        tryHandleMultisigMessage({ type: 'MULTISIG_JOIN_MEMBER', payload: req }, sendResponse, ok)
      ).rejects.toThrow('invalid token')
      expect(sendResponse).not.toHaveBeenCalled()
    })

    it('rejects when createMultisigProposal API fails after ensureRegistered', async () => {
      const req: CreateMultisigProposalRequest = {
        smartAccountAddress: 'CMULTI',
        operationKind: 'sac_transfer',
        recipient: 'GDEST',
        amount: '100',
      }
      ensureMultisigAccountRegisteredForSession.mockResolvedValue(undefined)
      createMultisigProposal.mockRejectedValue(new Error('threshold not met'))

      const sendResponse = vi.fn()
      await expect(
        tryHandleMultisigMessage(
          { type: 'MULTISIG_CREATE_PROPOSAL', payload: req },
          sendResponse,
          ok
        )
      ).rejects.toThrow('threshold not met')
      expect(sendResponse).not.toHaveBeenCalled()
    })

    it('rejects when ensureMultisigAccountRegisteredForSession fails before list proposals', async () => {
      const req = { smartAccountAddress: 'CMULTI' }
      ensureMultisigAccountRegisteredForSession.mockRejectedValue(new Error('not found'))

      const sendResponse = vi.fn()
      await expect(
        tryHandleMultisigMessage(
          { type: 'MULTISIG_LIST_PROPOSALS', payload: req },
          sendResponse,
          ok
        )
      ).rejects.toThrow('not found')
      expect(listMultisigProposals).not.toHaveBeenCalled()
    })

    it('rejects when executeMultisigProposal API fails', async () => {
      const req = { proposalId: 'prop-1' }
      executeMultisigProposal.mockRejectedValue(new Error('not enough approvals'))

      const sendResponse = vi.fn()
      await expect(
        tryHandleMultisigMessage(
          { type: 'MULTISIG_EXECUTE_PROPOSAL', payload: req },
          sendResponse,
          ok
        )
      ).rejects.toThrow('not enough approvals')
      expect(sendResponse).not.toHaveBeenCalled()
    })
  })
})
