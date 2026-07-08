# Latch backend — multisig member sync spec

**Audience:** Backend engineers and AI agents implementing changes in [`latch-backend`](https://latch-backend.onrender.com/swagger/index.html#/multisig-drafts).

**Goal:** After a multisig wallet is **deployed on-chain**, **every owner and member** who successfully joined the draft must see that wallet in their Latch extension account list — the same way passkey smart accounts appear today — without relying on fragile client-side heuristics or local-only invite state.

**Related docs in this repo:**

- Pinned Swagger: [`doc.json`](doc.json)
- Extension API client: [`apps/extension/src/background/api/`](apps/extension/src/background/api/)
- Extension sync (today): [`apps/extension/src/background/multisig/syncLocalAccounts.ts`](apps/extension/src/background/multisig/syncLocalAccounts.ts)
- Shared types: [`packages/types/src/multisig.ts`](packages/types/src/multisig.ts)

---

## Problem today

| Actor | What happens | Result |
|-------|----------------|--------|
| **Draft creator** | Calls `POST /api/multisig/drafts/{id}/deploy`, extension creates a local `StoredAccount` immediately | Creator sees the multisig wallet |
| **Member who joined via invite** | Joined via `POST /api/multisig/join/{token}/members`; extension stores a **local-only** pending invite and tries to sync | Member often **does not** see the wallet after deploy |
| **Member on a new device** | No pending invite in `chrome.storage.local` | No way to discover the wallet unless backend returns it |

Root cause: **membership is recorded on the draft**, but **deployed multisig account ownership is not consistently propagated to each member's session**. The extension compensates with local invite snapshots and passkey matching, which breaks for common flows (e.g. join with a **new** passkey that is never stored as a local passkey account).

The **long-term fix is backend-owned membership → account linkage** so `GET /api/multisig/accounts` is the single source of truth for “which multisig wallets belong to this session user.”

---

## What we are trying to achieve

### Product outcome

1. User A creates a multisig draft and invites User B.
2. User B joins with their passkey (new or existing).
3. User A sets threshold and deploys.
4. **Both** User A and User B open the extension → the multisig `C…` address appears in the account picker with correct label, threshold, and **their** `memberId` for approvals.
5. Same behavior if User B logs in later on another browser profile (session restored via WebAuthn login).

### Technical outcome

- **One deployed multisig** maps to **N session-visible account rows** (one per member session), not one row only for the deployer.
- Extension can drop most invite-based guessing and rely on `GET /api/multisig/accounts` on every cold start / account refresh.
- `POST /api/multisig/accounts/register` remains available as an idempotent safety net, not the primary member onboarding path.

---

## Extension client expectations (do not break)

The browser extension:

- Uses **cookie sessions** (`credentials: 'include'`) for all `/api/*` calls.
- Lists multisigs via `GET /api/multisig/accounts` → message `MULTISIG_LIST_ACCOUNTS`.
- Imports results into local storage via `syncLocalMultisigAccountsFromBackend` (background SW).
- Needs **`memberId`** on each returned account: the backend member row id **for the calling session user** on that multisig. The extension stores this as `StoredAccount.multisigMemberId` for proposal approvals.
- Accepts list response shapes (normalized in extension):

```ts
// Any of these are OK today:
{ accounts: MultisigAccount[] }
{ data: { accounts: MultisigAccount[] } }
MultisigAccount[]  // bare array
```

### `MultisigAccount` shape (minimum useful fields)

Aligned with [`packages/types/src/multisig.ts`](packages/types/src/multisig.ts):

```ts
interface MultisigAccount {
  id?: string                    // backend multisig account row id → StoredAccount.multisigBackendAccountId
  smartAccountAddress: string    // deployed C-address (required)
  threshold?: number
  label?: string                 // wallet display name
  memberId?: string              // THIS session user's member row id on this multisig (critical)
  members?: MultisigAccountMember[]  // optional; used to resolve memberId if memberId omitted
}
```

**`memberId` must be the row id for the authenticated session user**, not the creator's member id and not an arbitrary member from the list.

---

## Current API surface (relevant routes)

| Method | Path | Role today |
|--------|------|------------|
| `GET` | `/api/accounts` | Passkey/seed smart accounts only — **not** multisig |
| `GET` | `/api/multisig/accounts` | List session user's deployed multisig accounts |
| `POST` | `/api/multisig/accounts/register` | Persist deployed multisig for session user |
| `POST` | `/api/multisig/drafts` | Create draft (creator session) |
| `GET` | `/api/multisig/drafts?active=1` | Creator's in-progress draft |
| `POST` | `/api/multisig/drafts/{id}/deploy` | Deploy draft on-chain |
| `GET` | `/api/multisig/join/{token}` | Preview draft (**collecting only**) |
| `POST` | `/api/multisig/join/{token}/members` | Member joins draft |
| `GET` | `/api/multisig/proposals?account=C…` | Proposals for a known multisig address |

Swagger: [multisig-drafts](https://latch-backend.onrender.com/swagger/index.html#/multisig-drafts), [multisig-accounts](https://latch-backend.onrender.com/swagger/index.html#/multisig-accounts).

---

## Required backend improvements

### 1. Persist session ↔ draft member linkage at join time

**When:** `POST /api/multisig/join/{token}/members` succeeds (and after WebAuthn register/auth finish flows that precede it).

**Do:**

- Record that **this session user** is a member of **this draft** with a stable `member_id` (already returned on the draft member row).
- Store enough identity to match on later login:
  - **Passkey:** `credential_id` + `key_data_hex` (and/or link to `webauthn_credentials` row for this session).
  - **Delegated / seed (G-address):** `g_address`.
- Associate the join with the **same session** used by the extension (`Set-Cookie` from WebAuthn registration/login or prior `/api/webauthn/*` finish).

**Why:** Deploy happens later under the creator's session. At deploy time the backend must know **all sessions** that should receive the deployed account — not only the creator's.

**Suggested table (conceptual):**

```
multisig_draft_members
  id, draft_id, label, member_type, credential_id, key_data_hex, g_address, ...

multisig_draft_member_sessions   -- NEW or equivalent
  id, draft_member_id, session_id (or user_id), joined_at
```

If you already have `user_id` on draft members, ensure it is set for **invite joiners**, not only the draft owner.

---

### 2. On deploy — provision multisig accounts for **all** members

**When:** `POST /api/multisig/drafts/{id}/deploy` succeeds (first deploy or idempotent re-call).

**Do (atomic with deploy transaction):**

1. Deploy on-chain (existing behavior).
2. Create one **`multisig_accounts`** row (or equivalent) for the deployed `smart_account_address`, `threshold`, `account_salt_hex`, `label` / `wallet_name`, `draft_id`.
3. For **each draft member**, create a **`multisig_account_members`** (or equivalent) row linking that account to the draft member's signer material.
4. For **each draft member that has a linked session** (from §1), create a **session-visible membership** so `GET /api/multisig/accounts` returns the wallet for that session.
5. Mark draft `status = deployed` (or `live`) and persist `smart_account_address`, `account_salt_hex` on the draft for audit/history.

**Response** (extend existing deploy response; extension already reads these fields):

```ts
{
  smartAccountAddress: string
  alreadyDeployed?: boolean
  transactionHash?: string
  // optional but helpful:
  accountSaltHex?: string
  registeredMemberCount?: number
}
```

**Idempotency:** If the contract is already deployed, still ensure steps 2–4 are complete (repair path for members who joined before a partial deploy).

---

### 3. Fix `GET /api/multisig/accounts` — return all multisigs for this session

**When:** Any authenticated session calls list (extension calls on startup, home focus, and multisig hub).

**Do:**

- Return every **deployed** multisig where the session user is a **registered member** (via §2), not only accounts created by this session's deploy or register call.
- For each account include **`memberId`** scoped to the caller (see shape above).
- Include `label` (wallet name from draft) and `threshold`.

**Example:**

```json
{
  "accounts": [
    {
      "id": "acc-uuid-1",
      "smartAccountAddress": "CABC...",
      "threshold": 2,
      "label": "Family vault",
      "memberId": "member-row-for-this-session-user"
    }
  ]
}
```

**Empty list** is valid only when the user truly has no deployed multisig memberships.

---

### 4. Keep `POST /api/multisig/accounts/register` — idempotent member fallback

**When:** Client calls register after detecting on-chain deploy (extension uses this today in `maybeRegisterDeployedMultisig`).

**Do:**

- Allow **any session user who is a draft member** (or on-chain signer) to register the deployed account **for their own session**.
- Upsert: second call returns `200` / `409` with a stable duplicate semantics (extension treats `409` as success).
- After register, the account **must** appear in `GET /api/multisig/accounts` for that session.

**Do not** require the caller to be the draft owner.

Register body (unchanged contract):

```ts
{
  smartAccountAddress: string
  threshold: number
  accountSaltHex: string
  members: Array<{
    type: string       // passkey | delegated
    label?: string
    gAddress?: string
    credentialId?: string
    keyDataHex?: string
  }>
}
```

---

### 5. Join preview after deploy (optional but recommended)

**Today:** `GET /api/multisig/join/{token}` is documented as **collecting-only** and returns `404` after deploy. That is fine for the join UI, but members lose a server-backed way to resolve address/threshold post-deploy.

**Recommended (pick one):**

- **Option A (preferred):** Rely on §3 — members never need join preview after deploy; list endpoint is enough.
- **Option B:** Allow `GET /api/multisig/join/{token}` for deployed drafts to return a **read-only** summary:

```json
{
  "draft": {
    "id": "...",
    "status": "deployed",
    "smartAccountAddress": "C...",
    "threshold": 2,
    "walletName": "Family vault"
  },
  "members": [ ... ],
  "threshold": 2
}
```

If Option A is implemented fully, Option B is nice-to-have for debugging and older extension builds.

---

### 6. WebAuthn login — no regression

**When:** `POST /api/webauthn/authentication/finish` (extension onboarding / unlock).

**Do:**

- Session established here must be the same identity used in §1–§3.
- After login, `GET /api/multisig/accounts` must return all multisigs for passkeys tied to that session (including multisigs where the user joined with a **join-only** passkey that does not have a standalone `smart_accounts` row).

---

## End-to-end flows (acceptance scenarios)

### Flow A — Creator deploys, member already joined

```
Creator: POST /api/multisig/drafts
Member:  POST /api/multisig/join/{token}/members  (session B)
Creator: POST /api/multisig/drafts/{id}/deploy     (session A)
         → backend provisions account for sessions A and B

Session A: GET /api/multisig/accounts → [ { smartAccountAddress, memberId: creatorMemberId } ]
Session B: GET /api/multisig/accounts → [ { smartAccountAddress, memberId: memberMemberId } ]
```

### Flow B — Member joins after deploy

```
Creator: deploy (member not joined yet)
Member:  POST /api/multisig/join/{token}/members
         → backend must either reject (draft closed) OR support late join per product rules
```

**Product decision required:** If late join is **not** allowed, return `409` with a clear message. If allowed, updating signer set on-chain is a **v2** concern; for v1 document that members must join **before** deploy.

### Flow C — Member new device

```
Member: WebAuthn login (same credential as join)
        GET /api/multisig/accounts → multisig present with correct memberId
```

No dependency on extension local `latch.multisigPendingInvites`.

### Flow D — Idempotent deploy + register

```
Creator: POST deploy twice → 200, alreadyDeployed: true, all members still listed
Member:  POST register twice → 409 or 200, still listed in GET
```

---

## Data model checklist

Backend should be able to answer:

| Question | Must be true after fix |
|----------|-------------------------|
| Which sessions joined draft `D` as member `M`? | Queryable at deploy time |
| Which `C…` address did draft `D` deploy to? | Stored on draft / multisig_accounts |
| For session `S`, which multisigs am I in? | `GET /api/multisig/accounts` |
| For session `S` on multisig `C…`, what is my `memberId`? | Returned on list + proposal APIs |
| Is register idempotent per (session, smartAccountAddress)? | Yes |

---

## Errors and codes

Use stable, JSON-serializable errors (extension surfaces `message` to users):

| Situation | HTTP | Notes |
|-----------|------|-------|
| Join on deployed/closed draft | `409` | e.g. `draft_not_collecting` |
| Deploy with insufficient members | `400` | existing |
| Register duplicate for same session | `409` | extension treats as success |
| List without session | `401` or empty `accounts` | match existing auth pattern |
| Deploy draft not owned by caller | `404` | existing |

---

## Testing checklist (backend QA)

Manual or automated — use **two separate browser profiles** (session A = creator, session B = member):

- [ ] B joins via invite token; `GET /api/multisig/accounts` is empty **before** deploy (expected).
- [ ] A deploys; **within one request** B's list includes the multisig (no manual register from B).
- [ ] A's list includes the multisig with A's `memberId`; B's list includes B's `memberId` (different ids).
- [ ] B clears extension storage, logs in again → list still returns multisig.
- [ ] `POST /api/multisig/accounts/register` from B is idempotent.
- [ ] `GET /api/multisig/join/{token}` after deploy: `404` (current) or read-only deployed payload (Option B) — document chosen behavior in Swagger.
- [ ] `GET /api/multisig/proposals?account=C…` works for both sessions when `memberId` is used in approve flows.
- [ ] **Co-owner proposal ownership:** session B (member, not `multisig_accounts.user_id`) can `POST /api/multisig/proposals`, list, get, approve, and execute — same membership rule as `GET /api/multisig/accounts` (see `userCanAccessMultisigAccount` in `multisig_proposal_service.go` in the reference tree).
- [ ] Member joined with **new** passkey during join (no standalone smart account) still receives multisig in list.

---

## Extension follow-up (after backend ships)

Once §2–§3 are live, the extension can simplify (separate PR):

1. Treat `GET /api/multisig/accounts` as **primary** import path in `syncLocalMultisigAccountsFromBackend`.
2. Keep pending invites only for pre-deploy UX (“waiting for creator to deploy”).
3. Remove brittle `findDraftMemberForUser`-only gating when `memberId` + address come from the API.
4. Optionally stop polling join preview after deploy.

No extension change is **required** for correctness if the backend returns complete list data — existing `importListedRemoteAccounts` already creates local `StoredAccount` rows from the API.

---

## Implementation order (suggested)

1. **Session ↔ draft member linkage** on join (§1) — enables deploy-time fan-out.
2. **Deploy fan-out** to all member sessions (§2) — fixes the main bug.
3. **`GET /api/multisig/accounts` correctness** (§3) — verify `memberId` per caller.
4. **Register idempotency** for members (§4) — safety net.
5. Swagger + `doc.json` refresh on Render; extension pins updated spec.
6. Optional join-preview-after-deploy (§5).

---

## Swagger updates

When implementing, update Render Swagger descriptions to state explicitly:

- `GET /api/multisig/accounts` — returns multisigs where the **session user is a member**, not only where the user deployed.
- `POST /api/multisig/drafts/{id}/deploy` — **provisions** persisted multisig account rows for **all joined member sessions**.
- `POST /api/multisig/join/{token}/members` — **binds** the member to the **current session** for future account visibility.

Re-pin in this repo:

```bash
curl -o doc.json https://latch-backend.onrender.com/swagger/doc.json
```

---

## Summary

| Layer | Responsibility |
|-------|----------------|
| **Backend (this spec)** | Authoritative mapping: session user ↔ multisig memberships; fan-out on deploy; correct `GET /api/multisig/accounts` |
| **Extension** | Mirror API into `chrome.storage.local` `StoredAccount` list; use `memberId` for proposals |
| **On-chain** | Source of truth for signer set and thresholds; **not** used to discover “my multisigs” without an indexer |

**Success criterion:** Creator and every member who joined before deploy see the same `C…` multisig in the wallet account list after deploy, on any device where they authenticate with their member passkey — with no manual register step and no reliance on local invite files.
