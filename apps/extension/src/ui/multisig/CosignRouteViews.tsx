import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { CosignMemberInit, CosignRequest, MultisigPredictResponse, StoredAccount } from '@latch/types'

import {
  buildCosignInviteUrl,
  clearCosignJoinQueryFromLocation,
  parseCosignJoinTokenFromLocation,
  parseInviteTokenFromInput,
} from '../lib/cosignDeepLink'
import {
  apiClearMultisigDraftMeta,
  apiDeployCosignWallet,
  apiDiscoverMemberships,
  apiExecuteCosignRequest,
  apiGetCosignRequest,
  apiListCosignPending,
  apiPollJoinRelay,
  apiPostJoinRelay,
  apiPredictFromMembers,
  apiSealMemberWck,
  apiGetTransportPubkey,
  buildGAddressSigner,
  buildPasskeySigner,
  cosignNeedsMyApproval,
  cosignReadyToExecute,
  findLinkedAccount,
  newAccountSaltHex,
  newInviteToken,
  toDeploySigners,
} from '../lib/cosignFlow'
import { ensureCosignV1Auth } from '../lib/cosignV1Auth'
import { approveCosignRequest } from '../lib/cosignApprove'
import { listReusablePasskeyAccounts, enrollNewPasskeyForCosignWizard } from '../lib/multisigPasskey'
import { storedAccountLabel } from '../lib/storedAccountLabel'
import { CosignJoinFlow } from './CosignJoinFlow'
import { AddMultisigOwnersScreen } from '../screens/multisig/AddMultisigOwnersScreen'
import { CreateMultisigScreen } from '../screens/multisig/CreateMultisigScreen'
import { MultisigProposalDetailScreen } from '../screens/multisig/MultisigProposalDetailScreen'
import { MultisigProposalsScreen } from '../screens/multisig/MultisigProposalsScreen'
import { MultisigReviewDeployScreen } from '../screens/multisig/MultisigReviewDeployScreen'
import { MultisigSuccessScreen } from '../screens/multisig/MultisigSuccessScreen'
import { MultisigThresholdScreen } from '../screens/multisig/MultisigThresholdScreen'
import { MultisigWalletsScreen } from '../screens/multisig/MultisigWalletsScreen'

export type MultisigRoute =
  | 'createMultisig'
  | 'addMultisigOwners'
  | 'multisigThreshold'
  | 'multisigReviewDeploy'
  | 'multisigSuccess'
  | 'joinMultisig'
  | 'multisigProposals'
  | 'multisigProposalDetail'
  | 'multisigWallets'

type WizardState = {
  walletName: string
  purpose: string
  threshold: number
  members: CosignMemberInit[]
  accountSaltHex: string
  inviteToken: string
  smartAccountAddress: string
  /** Local passkey account used to sign cosign requests after deploy. */
  creatorLinkedAccountId?: string
  /** Index into `members` for the creator's owner row (enables remove guard + "You" badge). */
  creatorMemberIndex?: number
}

const RELAY_POLL_MS = 3000

export function useCosignJoinTokenOnMount(onJoin: (token: string) => void) {
  useEffect(() => {
    const token = parseCosignJoinTokenFromLocation()
    if (!token) return
    onJoin(token)
    clearCosignJoinQueryFromLocation()
  }, [onJoin])
}

export function CosignRouteViews({
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
  const [ownerAddError, setOwnerAddError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [passkeyAdding, setPasskeyAdding] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [predicted, setPredicted] = useState<MultisigPredictResponse | null>(null)
  const [predictLoading, setPredictLoading] = useState(false)
  const [predictError, setPredictError] = useState<string | null>(null)
  const [deployBusy, setDeployBusy] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)

  const [internalJoinToken, setInternalJoinToken] = useState<string | null>(null)
  const joinToken = externalJoinToken ?? internalJoinToken

  const [joinCode, setJoinCode] = useState('')
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null)

  const [proposals, setProposals] = useState<CosignRequest[]>([])
  const [proposalsLoading, setProposalsLoading] = useState(false)
  const [proposalsError, setProposalsError] = useState<string | null>(null)
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null)
  const [activeProposal, setActiveProposal] = useState<CosignRequest | null>(null)
  const [proposalBusy, setProposalBusy] = useState(false)
  const [proposalActionError, setProposalActionError] = useState<string | null>(null)

  const [pendingRelays, setPendingRelays] = useState<string[]>([])

  const reusablePasskeyAccounts = useMemo(
    () => listReusablePasskeyAccounts(accounts),
    [accounts]
  )
  const [selectedPasskeyAccountId, setSelectedPasskeyAccountId] = useState<string | undefined>()
  const selectedPasskeyAccount = useMemo(
    () => reusablePasskeyAccounts.find((a) => a.id === selectedPasskeyAccountId),
    [reusablePasskeyAccounts, selectedPasskeyAccountId]
  )
  const selectedPasskeyInOwners = useMemo(() => {
    if (!selectedPasskeyAccount || !wizard) return false
    const keyData = selectedPasskeyAccount.passkeyKeyDataHex?.trim()
    return Boolean(keyData && wizard.members.some((m) => m.keyDataHex === keyData))
  }, [selectedPasskeyAccount, wizard?.members])

  const inviteUrl = wizard ? buildCosignInviteUrl(wizard.inviteToken) : ''

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

  useEffect(() => {
    if (route !== 'multisigReviewDeploy' || !wizard) return
    setPredictLoading(true)
    setPredictError(null)
    void apiPredictFromMembers(wizard.threshold, wizard.members, wizard.accountSaltHex)
      .then(setPredicted)
      .catch((e) => setPredictError(e instanceof Error ? e.message : String(e)))
      .finally(() => setPredictLoading(false))
  }, [route, wizard?.threshold, wizard?.members, wizard?.accountSaltHex])

  const loadProposals = useCallback(async () => {
    if (!activeAccount?.smartAccountAddress || activeAccount.mode !== 'multisig') return
    const linked = findLinkedAccount(accounts, activeAccount)
    if (linked) {
      await ensureCosignV1Auth({
        linkedAccountId: linked.id,
        passkeyCredentialId: linked.passkeyCredentialId,
        surface,
      }).catch(() => {})
    }
    setProposalsLoading(true)
    setProposalsError(null)
    try {
      const list = await apiListCosignPending(activeAccount.smartAccountAddress)
      setProposals(list)
    } catch (e) {
      setProposalsError(e instanceof Error ? e.message : String(e))
    } finally {
      setProposalsLoading(false)
    }
  }, [activeAccount, accounts, surface])

  useEffect(() => {
    if (route === 'multisigProposals' || route === 'multisigProposalDetail') {
      void loadProposals()
    }
  }, [route, loadProposals, activeAccount?.id])

  useEffect(() => {
    if (route !== 'multisigProposalDetail' || !externalProposalId) return
    setProposalActionError(null)
    void apiGetCosignRequest(externalProposalId).then(setActiveProposal)
    setActiveProposalId(externalProposalId)
  }, [route, externalProposalId])

  useEffect(() => {
    if (!wizard?.inviteToken || !wizard.smartAccountAddress || pendingRelays.length === 0) return
    const id = window.setInterval(() => {
      void (async () => {
        for (const token of pendingRelays) {
          try {
            const relay = await apiPollJoinRelay(token)
            if (!relay?.transport_pubkey_b64 || !relay.member_blind_id) continue
            if (!wizard.smartAccountAddress) continue
            await apiSealMemberWck({
              inviteToken: token,
              walletRef: wizard.smartAccountAddress,
              memberBlindId: relay.member_blind_id,
              transportPubkeyB64: relay.transport_pubkey_b64,
            })
            setPendingRelays((prev) => prev.filter((t) => t !== token))
          } catch {
            // keep polling
          }
        }
      })()
    }, RELAY_POLL_MS)
    return () => window.clearInterval(id)
  }, [wizard?.inviteToken, wizard?.smartAccountAddress, pendingRelays])

  async function handleCreateContinue(walletName: string, purpose: string) {
    setCreateError(null)
    try {
      await apiClearMultisigDraftMeta()
    } catch {
      // best-effort — wizard is local; clear avoids stale draft sync hitting /api/multisig/drafts
    }
    setWizard({
      walletName,
      purpose,
      threshold: 2,
      members: [],
      accountSaltHex: newAccountSaltHex(),
      inviteToken: newInviteToken(),
      smartAccountAddress: '',
    })
    onSetRoute('addMultisigOwners')
  }

  async function addSelectedPasskeyOwner() {
    if (!wizard || !selectedPasskeyAccount) return
    const keyData = selectedPasskeyAccount.passkeyKeyDataHex?.trim()
    if (!keyData) {
      setPasskeyError('Passkey account is missing key data.')
      return
    }
    if (wizard.members.some((m) => m.keyDataHex === keyData)) {
      setPasskeyError('This passkey is already in the owner list.')
      return
    }
    setPasskeyError(null)
    const label = storedAccountLabel(
      selectedPasskeyAccount,
      accounts.findIndex((a) => a.id === selectedPasskeyAccount.id)
    )
    setWizard((w) => {
      if (!w) return w
      const members = [
        ...w.members,
        buildPasskeySigner(label, keyData, selectedPasskeyAccount.passkeyCredentialId),
      ]
      const next: WizardState = {
        ...w,
        members,
      }
      if (w.creatorLinkedAccountId === undefined) {
        next.creatorLinkedAccountId = selectedPasskeyAccount.id
        next.creatorMemberIndex = members.length - 1
      }
      return next
    })
  }

  async function addNewPasskeyOwner() {
    if (!wizard) return
    setPasskeyAdding(true)
    setPasskeyError(null)
    try {
      const account = await enrollNewPasskeyForCosignWizard({
        accounts,
        label: wizard.walletName,
        surface,
      })
      const keyData = account.passkeyKeyDataHex?.trim()
      if (!keyData) throw new Error('Passkey registration did not return key data.')
      const label = storedAccountLabel(
        account,
        accounts.findIndex((a) => a.id === account.id)
      )
      setWizard((w) => {
        if (!w) return w
        const members = [
          ...w.members.filter((m) => m.keyDataHex !== keyData),
          buildPasskeySigner(label, keyData, account.passkeyCredentialId),
        ]
        const next: WizardState = { ...w, members }
        if (w.creatorLinkedAccountId === undefined) {
          next.creatorLinkedAccountId = account.id
          next.creatorMemberIndex = members.length - 1
        }
        return next
      })
      setSelectedPasskeyAccountId(account.id)
      await onRefreshAccounts()
    } catch (e) {
      setPasskeyError(e instanceof Error ? e.message : String(e))
    } finally {
      setPasskeyAdding(false)
    }
  }

  async function handleDeploy() {
    if (!wizard) return
    const creator = wizard.creatorLinkedAccountId
      ? accounts.find((a) => a.id === wizard.creatorLinkedAccountId)
      : undefined
    if (!creator) {
      setDeployError('Add your passkey as an owner before deploying')
      return
    }
    setDeployBusy(true)
    setDeployError(null)
    try {
      const result = await apiDeployCosignWallet({
        threshold: wizard.threshold,
        signers: toDeploySigners(wizard.members),
        accountSaltHex: wizard.accountSaltHex,
        walletName: wizard.walletName,
        inviteToken: wizard.inviteToken,
        creatorLinkedAccountId: creator.id,
      })
      setWizard((w) =>
        w ? { ...w, smartAccountAddress: result.smartAccountAddress } : w
      )
      setPendingRelays([wizard.inviteToken])
      onSetActiveAccountId(result.account.id)
      await onRefreshAccounts()
      onSetRoute('multisigSuccess')
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : String(e))
    } finally {
      setDeployBusy(false)
    }
  }

  if (route === 'createMultisig') {
    return (
      <CreateMultisigScreen
        error={createError}
        onContinue={(walletName, purpose) => void handleCreateContinue(walletName, purpose)}
      />
    )
  }

  if (route === 'addMultisigOwners' && wizard) {
    return (
      <AddMultisigOwnersScreen
        members={wizard.members.map((m, i) => ({
          id: String(i),
          label: m.label,
          memberType: m.type,
          gAddress: m.gAddress,
          keyDataHex: m.keyDataHex,
        }))}
        inviteUrl={inviteUrl}
        inviteToken={wizard.inviteToken}
        youMemberId={
          wizard.creatorMemberIndex !== undefined ? String(wizard.creatorMemberIndex) : undefined
        }
        passkeyAdding={passkeyAdding}
        passkeyError={passkeyError}
        passkeyOptions={reusablePasskeyAccounts.map((a, i) => ({
          accountId: a.id,
          label: storedAccountLabel(a, i),
        }))}
        selectedPasskeyAccountId={selectedPasskeyAccountId}
        selectedPasskeyInOwners={selectedPasskeyInOwners}
        onSelectPasskeyAccountId={setSelectedPasskeyAccountId}
        canReusePasskey={reusablePasskeyAccounts.length > 0}
        addBusy={false}
        addError={ownerAddError}
        refreshBusy={false}
        onBack={() => onSetRoute('createMultisig')}
        onAddSelectedPasskeyOwner={() => void addSelectedPasskeyOwner()}
        onAddNewPasskeyOwner={() => void addNewPasskeyOwner()}
        onAddOwnerByAddress={(name, addr) => {
          setOwnerAddError(null)
          setWizard((w) =>
            w ? { ...w, members: [...w.members, buildGAddressSigner(name, addr)] } : w
          )
        }}
        onRemoveMember={(id) => {
          const idx = Number(id)
          setWizard((w) => {
            if (!w) return w
            const members = w.members.filter((_, i) => i !== idx)
            let creatorLinkedAccountId = w.creatorLinkedAccountId
            let creatorMemberIndex = w.creatorMemberIndex
            if (w.creatorMemberIndex === idx) {
              creatorLinkedAccountId = undefined
              creatorMemberIndex = undefined
            } else if (w.creatorMemberIndex !== undefined && w.creatorMemberIndex > idx) {
              creatorMemberIndex = w.creatorMemberIndex - 1
            }
            return { ...w, members, creatorLinkedAccountId, creatorMemberIndex }
          })
        }}
        onRefreshMembers={() => {}}
        onContinue={() => onSetRoute('multisigThreshold')}
      />
    )
  }

  if (route === 'multisigThreshold' && wizard) {
    return (
      <MultisigThresholdScreen
        memberCount={wizard.members.length}
        initialThreshold={wizard.threshold}
        onBack={() => onSetRoute('addMultisigOwners')}
        onContinue={(threshold) => {
          setWizard((w) => (w ? { ...w, threshold } : w))
          onSetRoute('multisigReviewDeploy')
        }}
      />
    )
  }

  if (route === 'multisigReviewDeploy' && wizard) {
    return (
      <MultisigReviewDeployScreen
        walletName={wizard.walletName}
        threshold={wizard.threshold}
        memberCount={wizard.members.length}
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
      <MultisigSuccessScreen
        walletName={wizard.walletName}
        smartAccountAddress={wizard.smartAccountAddress}
        threshold={wizard.threshold}
        memberCount={wizard.members.length}
        inviteUrl={inviteUrl}
        inviteToken={wizard.inviteToken}
        onGoHome={() => {
          setWizard(null)
          onSetRoute('home')
        }}
      />
    )
  }

  if (route === 'joinMultisig' && joinToken) {
    return (
      <CosignJoinFlow
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
        deployed={accounts
          .filter((a) => a.mode === 'multisig')
          .map((a) => ({
            smartAccountAddress: a.smartAccountAddress,
            label: a.label,
            threshold: a.multisigThreshold,
          }))}
        pendingInvites={[]}
        joinCode={joinCode}
        joinCodeError={joinCodeError}
        onBack={() => onSetRoute('home')}
        onOpenDeployed={async (account) => {
          const local = accounts.find((a) => a.smartAccountAddress === account.smartAccountAddress)
          if (local) onSetActiveAccountId(local.id)
          await onRefreshAccounts()
          onSetRoute('home')
        }}
        onOpenPendingInvite={() => {}}
        onJoinCodeChange={(value) => {
          setJoinCode(value)
          if (joinCodeError) setJoinCodeError(null)
        }}
        onSubmitJoinCode={() => {
          const token = parseInviteTokenFromInput(joinCode)
          if (!token) {
            setJoinCodeError('Paste a valid invite link or invite code.')
            return
          }
          setJoinCodeError(null)
          setJoinCode(token)
          setInternalJoinToken(token)
          onSetRoute('joinMultisig')
        }}
        onRemovePendingInvite={() => {}}
      />
    )
  }

  if (route === 'multisigProposals') {
    const memberId = activeAccount?.cosignBlindSignerId
    const pendingCount = proposals.filter((p) => cosignNeedsMyApproval(p, memberId)).length
    return (
      <MultisigProposalsScreen
        proposals={proposals.map((p) => ({
          id: p.id,
          status: p.status,
          threshold: p.threshold,
          approvalCount: p.signature_count,
        }))}
        loading={proposalsLoading}
        error={proposalsError}
        pendingCount={pendingCount}
        onBack={() => onSetRoute('home')}
        onOpenProposal={(id) => {
          setActiveProposalId(id)
          void apiGetCosignRequest(id).then(setActiveProposal)
          onSetRoute('multisigProposalDetail')
        }}
      />
    )
  }

  if (route === 'multisigProposalDetail' && activeAccount) {
    const linked = findLinkedAccount(accounts, activeAccount)
    return (
      <MultisigProposalDetailScreen
        proposal={
          activeProposal
            ? {
                id: activeProposal.id,
                status: activeProposal.status,
                threshold: activeProposal.threshold,
                approvalCount: activeProposal.signature_count,
                approvals: activeProposal.signatures?.map((s) => ({
                  memberId: s.blind_signer_id,
                })),
              }
            : null
        }
        loading={proposalBusy && !activeProposal}
        error={proposalActionError}
        busy={proposalBusy}
        needsMyApproval={
          activeProposal
            ? cosignNeedsMyApproval(activeProposal, activeAccount.cosignBlindSignerId)
            : false
        }
        onBack={() => onSetRoute('multisigProposals')}
        onApprove={() => {
          if (!activeProposal || !linked) return
          setProposalBusy(true)
          setProposalActionError(null)
          void ensureCosignV1Auth({
            linkedAccountId: linked.id,
            passkeyCredentialId: linked.passkeyCredentialId,
            surface,
          })
            .then(() =>
              approveCosignRequest({
                requestId: activeProposal.id,
                unsignedTxXdr: activeProposal.unsigned_tx_xdr,
                multisigAccount: activeAccount,
                linkedAccount: linked,
                surface,
              })
            )
            .then(setActiveProposal)
            .catch((e) => setProposalActionError(e instanceof Error ? e.message : String(e)))
            .finally(() => {
              setProposalBusy(false)
              void loadProposals()
            })
        }}
        onExecute={() => {
          if (!activeProposalId) return
          setProposalBusy(true)
          setProposalActionError(null)
          void apiExecuteCosignRequest({
            requestId: activeProposalId,
            smartAccountAddress: activeAccount.smartAccountAddress,
          })
            .then((res) => setActiveProposal(res.request))
            .catch((e) => setProposalActionError(e instanceof Error ? e.message : String(e)))
            .finally(() => {
              setProposalBusy(false)
              void loadProposals()
            })
        }}
        onRefresh={() => {
          if (!activeProposalId) return
          setProposalBusy(true)
          void apiGetCosignRequest(activeProposalId)
            .then(setActiveProposal)
            .finally(() => setProposalBusy(false))
        }}
      />
    )
  }

  return null
}

export function cosignPendingApprovalCount(
  proposals: CosignRequest[],
  blindSignerId: string | undefined
): number {
  if (!blindSignerId) return 0
  return proposals.filter((p) => cosignNeedsMyApproval(p, blindSignerId)).length
}
