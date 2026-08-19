import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  MultisigAccount,
  MultisigDraftMember,
  MultisigPendingInvite,
  MultisigPredictResponse,
  MultisigProposal,
  MultisigProposalDetail,
  StoredAccount,
} from '@latch/types'

import { friendlyError, sendToBackground } from '../lib/backgroundClient'
import {
  buildMultisigInviteUrl,
  clearMultisigJoinQueryFromLocation,
  parseMultisigJoinTokenFromLocation,
} from '../lib/multisigDeepLink'
import { formatMultisigProposalError } from '../lib/multisigErrors'
import {
  approveMultisigProposal,
  peekMultisigApprovalSigner,
  proposalNeedsMyApproval,
} from '../lib/multisigApprove'
import {
  apiAddDraftMember,
  apiSyncLocalMultisigAccounts,
  buildSeedDraftMemberFromGAddress,
  apiCreateLocalMultisigAccount,
  apiCreateMultisigDraft,
  apiDeployDraft,
  apiGetActiveDraft,
  apiGetProposal,
  apiJoinPreview,
  apiListMultisigAccounts,
  apiPredictDraft,
  apiRemoveDraftMember,
  apiUpdateDraftThreshold,
  extractDraftId,
  extractInviteToken,
  memberCountFromDraft,
} from '../lib/multisigFlow'
import {
  enrollExistingPasskeyForDraft,
  enrollNewPasskeyForDraft,
  listReusablePasskeyAccounts,
} from '../lib/multisigPasskey'
import { nextPasskeyRegistrationDisplayName } from '../webauthn/passkey'
import {
  findDraftMemberForStoredAccount,
} from '../lib/multisigJoinHelpers'
import { MultisigJoinFlow } from './MultisigJoinFlow'
import { multisigDraftMembersEqual } from '../lib/multisigMembers'
import { storedAccountLabel } from '../lib/storedAccountLabel'
import { toMultisigPasskeyOptions } from './MultisigPasskeyPicker'
import { AddMultisigOwnersScreen } from '../screens/multisig/AddMultisigOwnersScreen'
import { CreateMultisigScreen } from '../screens/multisig/CreateMultisigScreen'
import { MultisigProposalDetailScreen } from '../screens/multisig/MultisigProposalDetailScreen'
import { MultisigProposalsScreen } from '../screens/multisig/MultisigProposalsScreen'
import { MultisigReviewDeployScreen } from '../screens/multisig/MultisigReviewDeployScreen'
import { MultisigDeployFailureScreen } from '../screens/multisig/MultisigDeployFailureScreen'
import { MultisigDeploySuccessScreen } from '../screens/multisig/MultisigDeploySuccessScreen'
import { MultisigThresholdScreen } from '../screens/multisig/MultisigThresholdScreen'
import { MultisigWalletsScreen } from '../screens/multisig/MultisigWalletsScreen'
import { LatchLoadingOverlay } from '../components/LatchLoadingOverlay'

export type MultisigRoute =
  | 'createMultisig'
  | 'addMultisigOwners'
  | 'multisigThreshold'
  | 'multisigReviewDeploy'
  | 'multisigSuccess'
  | 'multisigDeployFailure'
  | 'joinMultisig'
  | 'multisigProposals'
  | 'multisigProposalDetail'
  | 'multisigWallets'

const MULTISIG_OWNERS_POLL_MS = 3000

type WizardState = {
  walletName: string
  purpose: string
  draftId: string
  inviteToken: string
  threshold: number
  smartAccountAddress: string
  creatorPasskeyMemberId?: string
}

export function useMultisigJoinTokenOnMount(onJoin: (token: string) => void) {
  useEffect(() => {
    const token = parseMultisigJoinTokenFromLocation()
    if (!token) return
    onJoin(token)
    clearMultisigJoinQueryFromLocation()
  }, [onJoin])
}

export function MultisigRouteViews({
  route,
  surface,
  activeAccount,
  accounts,
  externalJoinToken,
  onRefreshAccounts,
  onSetRoute,
  onSetActiveAccountId,
  externalProposalId,
}: {
  route: MultisigRoute | string
  surface: 'popup' | 'sidepanel'
  activeAccount: StoredAccount | undefined
  accounts: StoredAccount[]
  externalJoinToken?: string | null
  externalProposalId?: string | null
  onRefreshAccounts: () => Promise<void>
  onSetRoute: (route: string) => void
  onSetActiveAccountId: (id: string) => void
}) {
  const [wizard, setWizard] = useState<WizardState | null>(null)
  const [draftMembers, setDraftMembers] = useState<MultisigDraftMember[]>([])
  const [passkeyAdding, setPasskeyAdding] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [ownerAddError, setOwnerAddError] = useState<string | null>(null)
  const [ownerAddBusy, setOwnerAddBusy] = useState(false)
  const [ownersRefreshBusy, setOwnersRefreshBusy] = useState(false)
  const [createDraftError, setCreateDraftError] = useState<string | null>(null)
  const [predicted, setPredicted] = useState<MultisigPredictResponse | null>(null)
  const [predictLoading, setPredictLoading] = useState(false)
  const [predictError, setPredictError] = useState<string | null>(null)
  const [deployBusy, setDeployBusy] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)

  const [internalJoinToken, setInternalJoinToken] = useState<string | null>(null)
  const joinToken = externalJoinToken ?? internalJoinToken

  const [deployedAccounts, setDeployedAccounts] = useState<MultisigAccount[]>([])
  const [pendingInvites, setPendingInvites] = useState<MultisigPendingInvite[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null)

  const [proposals, setProposals] = useState<MultisigProposal[]>([])
  const [proposalsLoading, setProposalsLoading] = useState(false)
  const [proposalsError, setProposalsError] = useState<string | null>(null)
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null)
  const [activeProposal, setActiveProposal] = useState<MultisigProposalDetail | null>(null)
  const [proposalBusy, setProposalBusy] = useState(false)
  const [proposalActionError, setProposalActionError] = useState<string | null>(null)

  const inviteUrl = wizard ? buildMultisigInviteUrl(wizard.inviteToken) : ''
  const reusablePasskeyAccounts = useMemo(
    () => listReusablePasskeyAccounts(accounts),
    [accounts]
  )
  const [selectedPasskeyAccountId, setSelectedPasskeyAccountId] = useState<string | undefined>()
  const passkeyPickerOptions = useMemo(
    () =>
      toMultisigPasskeyOptions(reusablePasskeyAccounts, (account, index) => {
        const i = accounts.findIndex((a) => a.id === account.id)
        return storedAccountLabel(account, i >= 0 ? i : index)
      }),
    [reusablePasskeyAccounts, accounts]
  )
  const selectedPasskeyAccount = useMemo(
    () => reusablePasskeyAccounts.find((a) => a.id === selectedPasskeyAccountId),
    [reusablePasskeyAccounts, selectedPasskeyAccountId]
  )

  useEffect(() => {
    if (reusablePasskeyAccounts.length === 0) {
      setSelectedPasskeyAccountId(undefined)
      return
    }
    setSelectedPasskeyAccountId((prev) =>
      prev && reusablePasskeyAccounts.some((a) => a.id === prev)
        ? prev
        : reusablePasskeyAccounts[0]!.id
    )
  }, [reusablePasskeyAccounts])

  const applyDraftPasskeyEnrollment = useCallback(
    (draft: { members?: MultisigDraftMember[] }, credentialId: string) => {
      const members = draft.members ?? []
      setDraftMembers(members)
      const added = members.find((m) => m.credentialId === credentialId)
      if (added?.id) {
        setWizard((w) => (w ? { ...w, creatorPasskeyMemberId: added.id } : w))
      }
    },
    []
  )

  const handleSelectPasskeyAccountId = useCallback((accountId: string) => {
    setSelectedPasskeyAccountId(accountId)
  }, [])

  const addExistingPasskeyOwner = useCallback(async () => {
    if (!wizard?.draftId || wizard.creatorPasskeyMemberId || !selectedPasskeyAccount) return
    setPasskeyAdding(true)
    setPasskeyError(null)
    try {
      const draft = await enrollExistingPasskeyForDraft({
        draftId: wizard.draftId,
        account: selectedPasskeyAccount,
        label: wizard.walletName,
        surface,
      })
      applyDraftPasskeyEnrollment(draft, selectedPasskeyAccount.passkeyCredentialId!.trim())
    } catch (e) {
      setPasskeyError(e instanceof Error ? e.message : String(e))
    } finally {
      setPasskeyAdding(false)
    }
  }, [wizard, selectedPasskeyAccount, surface, applyDraftPasskeyEnrollment])

  const addNewPasskeyOwner = useCallback(async () => {
    if (!wizard?.draftId || wizard.creatorPasskeyMemberId) return
    setPasskeyAdding(true)
    setPasskeyError(null)
    try {
      const { draft, credentialId } = await enrollNewPasskeyForDraft({
        draftId: wizard.draftId,
        label: wizard.walletName,
        displayName: nextPasskeyRegistrationDisplayName(
          accounts,
          `${wizard.walletName || 'Latch'} multisig`
        ),
        surface,
      })
      applyDraftPasskeyEnrollment(draft, credentialId)
    } catch (e) {
      setPasskeyError(e instanceof Error ? e.message : String(e))
    } finally {
      setPasskeyAdding(false)
    }
  }, [wizard, surface, applyDraftPasskeyEnrollment, accounts])

  const refreshDraftMembers = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!wizard?.draftId) return
      if (!opts?.silent) setOwnersRefreshBusy(true)
      try {
        let members: MultisigDraftMember[] = []
        if (wizard.inviteToken) {
          const preview = await apiJoinPreview(wizard.inviteToken)
          members = preview.members ?? preview.draft?.members ?? []
        } else {
          const data = await apiGetActiveDraft()
          members = data.draft?.members ?? []
        }
        setDraftMembers((prev) => (multisigDraftMembersEqual(prev, members) ? prev : members))
        setWizard((w) => {
          if (!w) return w
          let creatorPasskeyMemberId = w.creatorPasskeyMemberId
          if (creatorPasskeyMemberId && !members.some((m) => m.id === creatorPasskeyMemberId)) {
            creatorPasskeyMemberId = undefined
          }
          if (!creatorPasskeyMemberId && selectedPasskeyAccount) {
            const added = findDraftMemberForStoredAccount(members, selectedPasskeyAccount)
            if (added?.id) creatorPasskeyMemberId = added.id
          }
          if (creatorPasskeyMemberId === w.creatorPasskeyMemberId) return w
          return { ...w, creatorPasskeyMemberId }
        })
      } catch {
        // ignore — refresh is best-effort
      } finally {
        if (!opts?.silent) setOwnersRefreshBusy(false)
      }
    },
    [wizard?.draftId, wizard?.inviteToken, selectedPasskeyAccount]
  )

  const passkeyAddingRef = useRef(passkeyAdding)
  passkeyAddingRef.current = passkeyAdding
  const ownerAddBusyRef = useRef(ownerAddBusy)
  ownerAddBusyRef.current = ownerAddBusy

  useEffect(() => {
    if (route !== 'addMultisigOwners' || !wizard?.draftId) return

    const poll = () => {
      if (passkeyAddingRef.current || ownerAddBusyRef.current) return
      void refreshDraftMembers({ silent: true })
    }

    const id = window.setInterval(poll, MULTISIG_OWNERS_POLL_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') poll()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [route, wizard?.draftId, refreshDraftMembers])

  useEffect(() => {
    if (route !== 'addMultisigOwners' || !wizard?.draftId) return
    void refreshDraftMembers()
  }, [route, wizard?.draftId, refreshDraftMembers])

  useEffect(() => {
    if (route !== 'multisigReviewDeploy' || !wizard?.draftId) return
    setPredictLoading(true)
    setPredictError(null)
    void apiPredictDraft(wizard.draftId)
      .then(setPredicted)
      .catch((e) => setPredictError(e instanceof Error ? e.message : String(e)))
      .finally(() => setPredictLoading(false))
  }, [route, wizard?.draftId])

  const loadProposals = useCallback(async () => {
    if (!activeAccount?.smartAccountAddress || activeAccount.mode !== 'multisig') return
    setProposalsLoading(true)
    setProposalsError(null)
    try {
      const res = await sendToBackground<
        { smartAccountAddress: string },
        import('@latch/types').ListMultisigProposalsResponse
      >({
        type: 'MULTISIG_LIST_PROPOSALS',
        payload: { smartAccountAddress: activeAccount.smartAccountAddress },
      })
      if (!res.ok || !res.data) throw new Error(friendlyError(res.error))
      setProposals(res.data.proposals ?? [])
    } catch (e) {
      setProposalsError(e instanceof Error ? e.message : String(e))
    } finally {
      setProposalsLoading(false)
    }
  }, [activeAccount])

  useEffect(() => {
    if (route === 'multisigProposals' || route === 'multisigProposalDetail') {
      void loadProposals()
    }
  }, [route, loadProposals, activeAccount?.id])

  useEffect(() => {
    if (route !== 'multisigProposalDetail' || !externalProposalId) return
    setProposalActionError(null)
    void loadProposalDetail(externalProposalId)
  }, [route, externalProposalId])

  const pendingApprovalCount = useMemo(() => {
    if (!activeAccount?.multisigMemberId) return 0
    return proposals.filter(
      (p) =>
        p.status !== 'executed' &&
        !(p as MultisigProposalDetail).approvals?.some(
          (a) => a.memberId === activeAccount.multisigMemberId
        )
    ).length
  }, [proposals, activeAccount?.multisigMemberId])

  const proposalApprovalUi = useMemo(() => {
    if (!activeProposal || !activeAccount) return null
    return peekMultisigApprovalSigner({
      proposal: activeProposal,
      activeAccount,
      accounts,
    })
  }, [activeProposal, activeAccount, accounts])

  const loadMultisigHub = useCallback(async () => {
    try {
      await apiSyncLocalMultisigAccounts()
      await onRefreshAccounts()
      const [accountsRes, invitesRes] = await Promise.all([
        apiListMultisigAccounts(),
        sendToBackground<undefined, { invites: MultisigPendingInvite[] }>({
          type: 'MULTISIG_GET_PENDING_INVITES',
          payload: undefined,
        }),
      ])
      setDeployedAccounts(accountsRes.accounts ?? [])
      if (invitesRes.ok && invitesRes.data) setPendingInvites(invitesRes.data.invites)
    } catch {
      // ignore
    }
  }, [onRefreshAccounts])

  useEffect(() => {
    if (route === 'multisigWallets') void loadMultisigHub()
  }, [route, loadMultisigHub])

  async function handleCreateMultisigContinue(walletName: string, purpose: string) {
    setCreateDraftError(null)
    try {
      const data = await apiCreateMultisigDraft()
      const draftId = extractDraftId(data)
      const inviteToken = extractInviteToken(data)
      setWizard({ walletName, purpose, draftId, inviteToken, threshold: 2, smartAccountAddress: '' })
      setDraftMembers(data.draft?.members ?? [])
      await sendToBackground({
        type: 'MULTISIG_SET_DRAFT_META',
        payload: { draftId, inviteToken, walletName, purpose },
      })
      onSetRoute('addMultisigOwners')
    } catch (e) {
      setCreateDraftError(e instanceof Error ? e.message : String(e))
    }
  }

  async function handleAddOwnerByAddress(ownerName: string, address: string) {
    if (!wizard?.draftId) return
    setOwnerAddBusy(true)
    setOwnerAddError(null)
    try {
      const draft = await apiAddDraftMember(
        wizard.draftId,
        buildSeedDraftMemberFromGAddress(ownerName, address)
      )
      setDraftMembers(draft.members ?? [])
    } catch (e) {
      setOwnerAddError(e instanceof Error ? e.message : String(e))
    } finally {
      setOwnerAddBusy(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!wizard?.draftId) return
    try {
      const draft = await apiRemoveDraftMember(wizard.draftId, memberId)
      setDraftMembers(draft.members ?? [])
      if (wizard.creatorPasskeyMemberId === memberId) {
        setWizard((w) => (w ? { ...w, creatorPasskeyMemberId: undefined } : w))
      }
    } catch (e) {
      setOwnerAddError(e instanceof Error ? e.message : String(e))
    }
  }

  async function handleDeploy() {
    if (!wizard?.draftId) return
    setDeployBusy(true)
    setDeployError(null)
    try {
      const result = await apiDeployDraft(wizard.draftId)
      const smartAccountAddress = result.smartAccountAddress
      const threshold = wizard.threshold
      let memberId = wizard.creatorPasskeyMemberId ?? activeAccount?.multisigMemberId
      try {
        const listed = await apiListMultisigAccounts()
        const match = listed.accounts?.find((a) => a.smartAccountAddress === smartAccountAddress)
        memberId = match?.memberId ?? memberId
      } catch {
        // ignore
      }
      const local = await apiCreateLocalMultisigAccount({
        smartAccountAddress,
        label: wizard.walletName,
        multisigThreshold: threshold,
        multisigMemberId: memberId,
        multisigBackendAccountId: undefined,
      })
      await apiSyncLocalMultisigAccounts()
      await sendToBackground({ type: 'MULTISIG_CLEAR_DRAFT_META', payload: undefined })
      setWizard((w) => (w ? { ...w, smartAccountAddress } : w))
      onSetActiveAccountId(local.account.id)
      await onRefreshAccounts()
      onSetRoute('multisigSuccess')
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : String(e))
      onSetRoute('multisigDeployFailure')
    } finally {
      setDeployBusy(false)
    }
  }

  async function loadProposalDetail(id: string) {
    setProposalBusy(true)
    try {
      const detail = await apiGetProposal(id)
      setActiveProposal(detail)
      setActiveProposalId(id)
    } finally {
      setProposalBusy(false)
    }
  }

  if (route === 'createMultisig') {
    return (
      <CreateMultisigScreen
        error={createDraftError}
        onBack={() => onSetRoute('home')}
        onContinue={(walletName, purpose) => void handleCreateMultisigContinue(walletName, purpose)}
      />
    )
  }

  if (route === 'addMultisigOwners' && wizard) {
    return (
      <AddMultisigOwnersScreen
        walletName={wizard.walletName}
        members={draftMembers}
        inviteUrl={inviteUrl}
        inviteToken={wizard.inviteToken}
        youMemberId={wizard.creatorPasskeyMemberId}
        passkeyAdding={passkeyAdding}
        passkeyError={passkeyError}
        passkeyOptions={passkeyPickerOptions}
        selectedPasskeyAccountId={selectedPasskeyAccountId}
        onSelectPasskeyAccountId={handleSelectPasskeyAccountId}
        canReusePasskey={reusablePasskeyAccounts.length > 0}
        addBusy={ownerAddBusy}
        addError={ownerAddError}
        refreshBusy={ownersRefreshBusy}
        onBack={() => onSetRoute('createMultisig')}
        onAddSelectedPasskeyOwner={() => void addExistingPasskeyOwner()}
        onAddNewPasskeyOwner={() => void addNewPasskeyOwner()}
        onAddOwnerByAddress={(name, addr) => void handleAddOwnerByAddress(name, addr)}
        onRemoveMember={(id) => void handleRemoveMember(id)}
        onRefreshMembers={() => void refreshDraftMembers()}
        ownersLiveUpdating
        onContinue={() => onSetRoute('multisigThreshold')}
      />
    )
  }

  if (route === 'multisigThreshold' && wizard) {
    return (
      <MultisigThresholdScreen
        memberCount={memberCountFromDraft({ members: draftMembers })}
        initialThreshold={wizard.threshold}
        onBack={() => onSetRoute('addMultisigOwners')}
        onContinue={(threshold) => {
          void apiUpdateDraftThreshold(wizard.draftId, threshold).then(() => {
            setWizard((w) => (w ? { ...w, threshold } : w))
            onSetRoute('multisigReviewDeploy')
          })
        }}
      />
    )
  }

  if (route === 'multisigReviewDeploy' && wizard) {
    return (
      <MultisigReviewDeployScreen
        walletName={wizard.walletName}
        threshold={wizard.threshold}
        memberCount={memberCountFromDraft({ members: draftMembers })}
        predicted={predicted}
        predictLoading={predictLoading}
        predictError={predictError}
        deployBusy={deployBusy}
        deployError={deployError}
        onBack={() => onSetRoute('multisigThreshold')}
        onDeploy={() => void handleDeploy()}
      />
    )
  }

  if (route === 'multisigSuccess' && wizard) {
    return (
      <MultisigDeploySuccessScreen
        smartAccountAddress={wizard.smartAccountAddress}
        onCopyAddress={() => {
          const addr = wizard.smartAccountAddress?.trim()
          if (!addr) return
          void navigator.clipboard.writeText(addr)
        }}
        onShareAddress={() => {
          const addr = wizard.smartAccountAddress?.trim()
          if (!addr) return
          const share = (navigator as unknown as { share?: (data: { text: string }) => Promise<void> })
            .share
          if (share) {
            void share({ text: addr }).catch(() => {
              void navigator.clipboard.writeText(addr)
            })
          } else {
            void navigator.clipboard.writeText(addr)
          }
        }}
        onOpenReceiveQr={() => {
          // Reuse the existing Receive QR flow; it uses the active account address.
          setWizard(null)
          onSetRoute('receive')
        }}
        onGoToWallet={() => {
          setWizard(null)
          onSetRoute('home')
        }}
      />
    )
  }

  if (route === 'multisigDeployFailure' && wizard) {
    return (
      <MultisigDeployFailureScreen
        onTryAgain={() => {
          onSetRoute('multisigReviewDeploy')
        }}
      />
    )
  }

  if (route === 'joinMultisig' && joinToken) {
    return (
      <MultisigJoinFlow
        token={joinToken}
        accounts={accounts}
        surface={surface}
        onAccountsSynced={onRefreshAccounts}
        onJoined={() => onSetRoute('multisigWallets')}
        onBack={() => onSetRoute('home')}
      />
    )
  }

  if (route === 'multisigWallets') {
    return (
      <MultisigWalletsScreen
        deployed={deployedAccounts}
        pendingInvites={pendingInvites}
        joinCode={joinCode}
        joinCodeError={joinCodeError}
        onBack={() => onSetRoute('home')}
        onOpenDeployed={async (account) => {
          const local = accounts.find((a) => a.smartAccountAddress === account.smartAccountAddress)
          if (local) {
            onSetActiveAccountId(local.id)
            await onRefreshAccounts()
          } else {
            const created = await apiCreateLocalMultisigAccount({
              smartAccountAddress: account.smartAccountAddress,
              label: account.label,
              multisigThreshold: account.threshold,
              multisigMemberId: account.memberId,
              multisigBackendAccountId: account.id,
            })
            onSetActiveAccountId(created.account.id)
            await onRefreshAccounts()
          }
          onSetRoute('home')
        }}
        onOpenPendingInvite={(invite) => {
          setInternalJoinToken(invite.token)
          onSetRoute('joinMultisig')
        }}
        onJoinCodeChange={setJoinCode}
        onSubmitJoinCode={() => {
          const token = joinCode.trim()
          if (!token) {
            setJoinCodeError('Enter an invite token')
            return
          }
          setJoinCodeError(null)
          setInternalJoinToken(token)
          onSetRoute('joinMultisig')
        }}
        onRemovePendingInvite={(token) => {
          void sendToBackground<
            { token: string },
            { invites: MultisigPendingInvite[] }
          >({ type: 'MULTISIG_REMOVE_PENDING_INVITE', payload: { token } }).then((res) => {
            if (res.ok && res.data?.invites) setPendingInvites(res.data.invites)
          })
        }}
      />
    )
  }

  if (route === 'multisigProposals') {
    return (
      <div className="relative flex h-full min-h-0 w-full flex-col">
        <MultisigProposalsScreen
          proposals={proposals}
          loading={proposalsLoading}
          error={proposalsError}
          pendingCount={pendingApprovalCount}
          onBack={() => onSetRoute('home')}
          onOpenProposal={(id) => {
            void loadProposalDetail(id)
            onSetRoute('multisigProposalDetail')
          }}
        />
        {proposalsLoading ? <LatchLoadingOverlay label="Loading..." /> : null}
      </div>
    )
  }

  if (route === 'multisigProposalDetail') {
    return (
      <div className="relative flex h-full min-h-0 w-full flex-col">
        <MultisigProposalDetailScreen
          proposal={activeProposal}
          loading={proposalBusy && !activeProposal}
          error={proposalActionError}
          busy={proposalBusy}
          needsMyApproval={
            activeProposal && activeAccount
              ? proposalNeedsMyApproval(activeProposal, activeAccount.multisigMemberId)
              : false
          }
          approveLabel={proposalApprovalUi?.approveLabel}
          approveBusyLabel={proposalApprovalUi?.busyLabel}
          onBack={() => onSetRoute('multisigProposals')}
          onApprove={() => {
            if (!activeProposal || !activeAccount) return
            setProposalBusy(true)
            setProposalActionError(null)
            void approveMultisigProposal({
              proposal: activeProposal,
              activeAccount,
              accounts,
              surface,
            })
              .then(setActiveProposal)
              .catch((e) => {
                const raw = e instanceof Error ? e.message : String(e)
                setProposalActionError(formatMultisigProposalError(raw))
              })
              .finally(() => {
                setProposalBusy(false)
                void loadProposals()
              })
          }}
          onExecute={() => {
            if (!activeProposalId) return
            setProposalBusy(true)
            setProposalActionError(null)
            void sendToBackground({
              type: 'MULTISIG_EXECUTE_PROPOSAL',
              payload: { proposalId: activeProposalId },
            })
              .then((res) => {
                if (!res.ok) {
                  setProposalActionError(formatMultisigProposalError(friendlyError(res.error)))
                  return
                }
                return loadProposalDetail(activeProposalId)
              })
              .catch((e) => {
                const raw = e instanceof Error ? e.message : String(e)
                setProposalActionError(formatMultisigProposalError(raw))
              })
              .finally(() => {
                setProposalBusy(false)
                void loadProposals()
              })
          }}
          onRefresh={() => {
            if (!activeProposalId) return
            setProposalBusy(true)
            setProposalActionError(null)
            void sendToBackground<
              { proposalId: string },
              MultisigProposalDetail
            >({
              type: 'MULTISIG_REFRESH_PROPOSAL',
              payload: { proposalId: activeProposalId },
            })
              .then((res) => {
                if (!res.ok) {
                  setProposalActionError(formatMultisigProposalError(friendlyError(res.error)))
                  return
                }
                if (res.data) setActiveProposal(res.data)
              })
              .catch((e) => {
                const raw = e instanceof Error ? e.message : String(e)
                setProposalActionError(formatMultisigProposalError(raw))
              })
              .finally(() => setProposalBusy(false))
          }}
        />
        {proposalBusy && !activeProposal ? <LatchLoadingOverlay label="Loading..." /> : null}
      </div>
    )
  }

  return null
}

export function multisigPendingApprovalCount(
  proposals: MultisigProposal[],
  memberId: string | undefined
): number {
  if (!memberId) return 0
  return proposals.filter(
    (p) =>
      p.status !== 'executed' &&
      !(p as MultisigProposalDetail).approvals?.some((a) => a.memberId === memberId)
  ).length
}
