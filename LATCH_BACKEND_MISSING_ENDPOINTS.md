# Latch backend — extension integration reference

**Audience:** Backend engineers working on [`latch-backend.onrender.com`](https://latch-backend.onrender.com/swagger/index.html#/) (Go API + Swagger).

**Status (2026-06):** All **22** HTTP routes the browser extension calls are now listed in [Render Swagger](https://latch-backend.onrender.com/swagger/index.html#/) and pinned in repo [`doc.json`](doc.json). The extension defaults to Render (`PLASMO_PUBLIC_LATCH_API_URL=https://latch-backend.onrender.com`). Remaining work is **runtime verification** (response shapes, cookies, WebAuthn RP ID) — not new route discovery.

**Extension client:** [`apps/extension/src/background/api/*`](apps/extension/src/background/api/) (re-exported from [`backend.ts`](apps/extension/src/background/backend.ts))  
**Shared contracts:** [`packages/types`](packages/types/src/index.ts) (`@latch/types`)

---

## Context

### API bases (single host by default)

| Env var | Default | Role |
|---------|---------|------|
| `PLASMO_PUBLIC_LATCH_API_URL` | `https://latch-backend.onrender.com` | Wallet, WebAuthn, transactions, smart-account (`/api/*`) |
| `PLASMO_PUBLIC_LATCH_MARKET_API_URL` | `{LATCH_API_URL}/v1` | Token USD prices (`GET /v1/prices`) |

Override either var for Vercel (`https://v0-latch-stellar.vercel.app`) or local (`http://localhost:3000`) during rollback or dev.

### Swagger parity

Render Swagger documents every extension route, including the 11 paths that were previously missing from Swagger:

- `GET|POST /api/smart-account/freighter`
- `POST /api/smart-account`, `POST /api/smart-account/webauthn`
- `POST /api/smart-account/setup-send-rules`, `POST /api/smart-account/setup-swap-rules`
- `POST /api/transaction/build|build-delegated|build-send|build-swap|prepare-sign|submit|submit-delegated|submit-webauthn`
- `GET /api/sign-payload/{payloadRef}`
- Session/WebAuthn: `GET /api/accounts`, `POST /api/accounts/set-active`, WebAuthn begin/finish
- Market: `GET /v1/prices`

Swap-specific behavior is also described in [`LATCH_API_SWAP_ENDPOINTS_SPEC.md`](LATCH_API_SWAP_ENDPOINTS_SPEC.md).

**Session / cookies:** Extension `fetch` uses `credentials: 'include'` for all `/api/*` calls.

**WebAuthn extension origin:** On begin/finish/submit-webauthn bodies, the extension sends `chromeExtensionId` so the server sets `rp.id` / `expectedOrigin` to `chrome-extension://<id>`. See [`AGENTS.md`](AGENTS.md).

### Manual smoke (Render, curl)

| Tier | Route | Result |
|------|-------|--------|
| T1 | `GET /v1/prices?tokens=xlm,usdc` | **Pass** — `{ data: { xlm: { price, change_24h }, … } }` |
| T1 | `GET /api/accounts` | **Pass** — `{ accounts: [] }` |
| T1 | `GET /api/smart-account/freighter?gAddress=G…` | **404** at time of test — documented in Swagger; verify live deployment |
| T2 | `POST /api/webauthn/registration/begin` | **404** at time of test — documented in Swagger; verify live deployment |

Re-run after backend deploys; full passkey onboarding (T2) requires Chrome + extension UI.

---

## Extension route checklist (all in Swagger)

| # | Method | Path | Test tier |
|---|--------|------|-----------|
| 1 | `GET` | `/api/smart-account/freighter` | T1 |
| 2 | `POST` | `/api/smart-account/freighter` | T4 |
| 3 | `POST` | `/api/smart-account` | T5 |
| 4 | `POST` | `/api/transaction/build-swap` | T5 |
| 5 | `POST` | `/api/smart-account/setup-send-rules` | T4 |
| 6 | `POST` | `/api/smart-account/setup-swap-rules` | T5 |
| 7 | `POST` | `/api/transaction/build` | T6 |
| 8 | `POST` | `/api/transaction/build-delegated` | T6 |
| 9 | `POST` | `/api/transaction/submit` | T5 |
| 10 | `POST` | `/api/transaction/submit-delegated` | T4 |
| 11 | `POST` | `/api/transaction/prepare-sign` | T5 |

---

## 1. `GET /api/smart-account/freighter`

**Extension:** `getFreighterSmartAccountStatus()` → also used inside `ensureFreighterSmartAccountDeployed()`

**When used:**
- Before deploying a Freighter-linked smart account: predict address + whether factory deploy is already done.
- **Seed / recovery-phrase import** (`IMPORT_MNEMONIC_ACCOUNT`): derives classic `G…` from mnemonic, then calls `ensureFreighterSmartAccountDeployed(gAddress)` before creating a local `mnemonic` account.

**Query params:**

| Param | Required | Description |
|-------|----------|-------------|
| `gAddress` | yes | Classic Stellar public key (`G…`) |

**Response** (`FreighterSmartAccountStatusResponse`):

```ts
{
  deployed: boolean
  smartAccountAddress: string  // predicted or deployed C-address
}
```

**Notes:** Read-only; no session required for predict-style behavior on the Next.js API. Only the public `gAddress` is sent over HTTPS (no private key).

---

## 2. `POST /api/smart-account/freighter`

**Extension:** `createOrConnectFreighter()`

**Background message:** `CREATE_OR_CONNECT_FREIGHTER`

**When used:**
- User connects an existing **Freighter** wallet during onboarding or add-account.
- Called from `ensureFreighterSmartAccountDeployed()` when `GET` returns `deployed: false`.

**Request** (`CreateOrConnectFreighterRequest`):

```ts
{ gAddress: string }
```

**Response** (`CreateOrConnectFreighterResponse`):

```ts
{
  smartAccountAddress: string
  alreadyDeployed: boolean
}
```

**Notes:** Deploys (or idempotently returns) a smart account with the Freighter `G` as delegated signer. Extension then stores a local `StoredAccount` with `mode: 'freighter'`.

---

## 3. `POST /api/smart-account`

**Extension:** `createOrConnectPhantom()`

**Background message:** `CREATE_OR_CONNECT_PHANTOM`

**When used:**
- User connects a **Phantom** (Solana) wallet as signer for a Stellar smart account.

**Request** (`CreateOrConnectPhantomRequest`):

```ts
{ publicKeyHex: string }  // 32-byte Ed25519 pubkey, hex, no 0x prefix
```

**Response** (`CreateOrConnectPhantomResponse`):

```ts
{
  smartAccountAddress: string
  gAddress: string           // linked classic address used by backend
  alreadyDeployed: boolean
}
```

**Notes:** Distinct from `POST /api/smart-account/webauthn` (passkey deploy). Phantom signing later uses `POST /api/transaction/submit`.

---

## 4. `POST /api/transaction/build-swap`

**Extension:** `buildSwapTx()` via `PREPARE_SWAP_TX` when quote provider is Aquarius.

**When used:**
- **Swap confirm flow** (`LatchRoot.executeSwapWithSetupLoop` → `swap/handlers.runPrepareSwapTx`).
- Preferred path: server builds Aquarius `swap_chained` tx with correct context rules, simulation, and auth entries (mirrors `build-send`).

**Request** (`BuildSwapTxRequest`):

```ts
{
  network: 'testnet' | 'mainnet'
  smartAccountAddress: string
  signerType: 'passkey' | 'phantom' | 'freighter'
  signerG?: string
  routerContractId: string      // Aquarius router C-address
  swapChainXdr: string          // base64 XDR from Aquarius find-path
  tokenInContractId: string
  amountInRaw: string
  amountOutMinRaw: string
  providerId?: string
}
```

**Response** (`BuildSwapTxResponse` — extends `BuildSendTxResponse`):

Same fields as `build-send` (`txXdr`, `authEntryXdr`, `authEntriesXdr?`, `authDigestHex`, `contextRuleId`, `validUntilLedger`, fee estimates, delegated fields when applicable), plus optional:

```ts
{
  routerContractId?: string
  tokenInContractId?: string
  providerId?: string
}
```

**Notes:** See [`LATCH_API_SWAP_ENDPOINTS_SPEC.md`](LATCH_API_SWAP_ENDPOINTS_SPEC.md) for bundler fee-payer model, multi-auth entries, and parity with `build-send`. Return `409` / `NO_CONTEXT_RULE` when swap context rules are missing so the extension can run `setup-swap-rules`.

---

## 5. `POST /api/smart-account/setup-send-rules`

**Extension:** `setupSendRules()`

**Background message:** `SETUP_SEND_RULES`

**When used:**
- **Send flow** when `POST /api/transaction/build-send` returns a no-context-rule error.
- Extension loops: setup → user signs setup tx → retry build (up to 5 attempts).
- Creates on-chain `CallContract(<SAC>)` context rules for `transfer` per asset.

**Request** (`SetupSendRulesRequest`):

```ts
{
  smartAccountAddress: string
  signerType: 'passkey' | 'phantom' | 'freighter'
  assetId?: string
  assetIds?: string[]
  publicKeyHex?: string       // phantom
  verifierAddress?: string    // passkey — must match WEBAUTHN_VERIFIER_ADDRESS
  keyDataHex?: string         // passkey
  gAddress?: string            // freighter / mnemonic
}
```

**Response** (`SetupSendRulesResponse` — extends `BuildSendTxResponse`):

```ts
{
  // ...BuildSendTxResponse fields for the setup transaction user must sign...
  alreadyConfigured?: boolean
  message?: string
  configuredAsset?: BuildSendAssetInfo
  remainingSetupCount?: number
  instructions?: string
}
```

**Notes:** When `alreadyConfigured: true`, extension skips signing. Setup tx is submitted via the same paths as a normal send (`submit-webauthn`, `submit-delegated`, or `submit` depending on account mode).

---

## 6. `POST /api/smart-account/setup-swap-rules`

**Extension:** `setupSwapRules()`

**Background message:** `SETUP_SWAP_RULES`

**When used:**
- **Swap flow** when prepare/build returns `NO_CONTEXT_RULE` or signer reconfigure errors.
- One-time (per router) `CallContract(<Aquarius router>)` context rule for `swap_chained`.

**Request** (`SetupSwapRulesRequest`):

```ts
{
  smartAccountAddress: string
  signerType: 'passkey' | 'phantom' | 'freighter'
  network: 'testnet' | 'mainnet'
  providerId?: string
  routerContractId?: string
  publicKeyHex?: string
  verifierAddress?: string
  keyDataHex?: string
  credentialId?: string
  gAddress?: string
}
```

**Response** (`SetupSwapRulesResponse`):

```ts
{
  // ...SetupSendRulesResponse fields...
  routerContractId?: string
}
```

**Notes:** Documented in detail in [`LATCH_API_SWAP_ENDPOINTS_SPEC.md`](LATCH_API_SWAP_ENDPOINTS_SPEC.md). Extension treats `signer_already_exists` as success.

---

## 7. `POST /api/transaction/build`

**Extension:** `buildTx()`

**Background message:** `BUILD_TX` (handler exists; **no UI caller today**)

**When used:**
- Generic smart-account transaction build for SAC `transfer` intent.
- Kept for API parity and future flows; implement for completeness.

**Request** (`BuildTxRequest`):

```ts
{
  smartAccountAddress: string
  signerG?: string
  transfer?: {
    sacContractId: string
    assetCode: string
    assetIssuer?: string
    destination: string
    amount: string
    memo?: string
  }
}
```

**Response** (`BuildTxResponse`):

```ts
{
  txXdr: string
  authEntryXdr: string
  authDigestHex: string
  contextRuleId: string
  validUntilLedger: number
  estimatedFeeXlm?: string
  estimatedFeeUsd?: string
  feeLabel?: string
}
```

---

## 8. `POST /api/transaction/build-delegated`

**Extension:** `buildDelegatedTx()`

**Background message:** `BUILD_DELEGATED_TX` (handler exists; **no direct UI caller today**)

**When used:**
- Build path where the **delegated G signer** (Freighter / mnemonic) co-signs alongside the smart account auth entry.
- Related to Freighter and seed-based accounts; overlaps with fields returned by `build-send` for delegated mode.

**Request** (`BuildDelegatedTxRequest`):

```ts
{
  smartAccountAddress: string
  gAddress: string
  transfer?: BuildTransferIntent  // same shape as build
}
```

**Response** (`BuildDelegatedTxResponse`):

```ts
{
  txXdr: string
  smartAccountAuthEntryXdr: string
  gAddressPreimageXdr: string
  gAddressEntryTemplateXdr: string
  authDigestHex: string
  estimatedFeeXlm?: string
  estimatedFeeUsd?: string
  feeLabel?: string
}
```

---

## 9. `POST /api/transaction/submit`

**Extension:** `submitTxPhantom()`

**Background message:** `SUBMIT_TX_PHANTOM`

**When used:**
- After **Phantom** signs the auth digest (Solana `signMessage` on a prefixed Stellar message).
- Send, swap setup, and any flow using `signAndSubmitBuiltTx()` for `mode: 'phantom'`.

**Request** (`SubmitPhantomTxRequest`):

```ts
{
  txXdr: string
  authEntryXdr: string
  authSignatureHex: string
  prefixedMessage: string
  publicKeyHex: string
  contextRuleId: number | string
}
```

**Response** (`SubmitTxResponse`):

```ts
{
  transactionHash?: string
  hash?: string
  status?: string
}
```

---

## 10. `POST /api/transaction/submit-delegated`

**Extension:** `submitTxDelegated()`

**Background message:** `SUBMIT_TX_DELEGATED`

**When used:**
- **Freighter** accounts: user signs delegated auth entry via Freighter API, extension submits.
- **Mnemonic / seed** accounts: background signs delegated entry locally, then submits.
- Send, swap, and setup-rule transactions when build response includes delegated auth fields.

**Request** (`SubmitDelegatedTxRequest`):

```ts
{
  txXdr: string
  smartAccountAuthEntryXdr: string
  gAddressEntryTemplateXdr: string
  signedAuthEntryBase64: string   // raw 64-byte Ed25519 sig, base64
  signerAddress: string
  authEntriesXdr?: string[]
  smartAccountAuthEntryIndex?: number
  delegatedGAuthEntrySynthesized?: boolean
}
```

**Response:** `SubmitTxResponse` (same as above).

**Notes:** For multi-auth swaps, extension may send full `authEntriesXdr` (passkey + bundler delegated G). See swap spec for merge behavior.

---

## 11. `POST /api/transaction/prepare-sign` *(honorable mention — required)*

**Extension:** `prepareSign()`

**When used:**

1. **Non-Aquarius swaps** (`swap/handlers.runPrepareSwapTx`): extension builds unsigned XDR locally (e.g. Soroswap), then asks API to simulate, attach auth entries, and return review metadata.
2. **External / dapp signing** (`externalSign/orchestrator.ts`): dapp provides `unsignedTxXdr` or `payloadRef` (from `GET /api/sign-payload/{ref}`); extension calls prepare-sign before user approval and submit.

**Request** (`PrepareSignRequest`):

```ts
{
  network: 'testnet' | 'mainnet'
  smartAccountAddress: string
  unsignedTxXdr: string
  signerType?: 'passkey' | 'phantom' | 'freighter'
  signerG?: string
  feePayerG?: string   // bundler public G when tx source is fee-payer
}
```

**Response** (`PrepareSignResponse` — extends `BuildSendTxResponse`):

```ts
{
  // ...BuildSendTxResponse...
  network: 'testnet' | 'mainnet'
  smartAccountAddress: string
  operations?: { type: string; summary: string; details?: Record<string, string> }[]
  warnings?: string[]
  delegatedGAuthEntrySynthesized?: boolean
  submitMethod?: 'webauthn' | 'delegated' | 'bundler-delegated'
}
```

**Error contract:** Return **`409`** with code **`NO_CONTEXT_RULE`** when the smart account lacks rules for the operation’s target contract — extension then runs `setup-send-rules` or `setup-swap-rules`.

**Notes:** Critical for passkey + bundler fee-payer swaps until `build-swap` fully replaces the local-XDR path. See [`LATCH_API_SWAP_ENDPOINTS_SPEC.md`](LATCH_API_SWAP_ENDPOINTS_SPEC.md).

---

## Extension flows → endpoint map

### Onboarding / add account

```
Freighter connect     → GET/POST /api/smart-account/freighter
Phantom connect       → POST /api/smart-account
Passkey create        → POST /api/webauthn/registration/* + POST /api/smart-account/webauthn (documented)
Seed import           → GET/POST /api/smart-account/freighter (via derived G)
```

### Send (working reference on Next.js API)

```
BUILD_SEND_TX         → POST /api/transaction/build-send (documented)
SETUP_SEND_RULES      → POST /api/smart-account/setup-send-rules  ← missing
Submit passkey        → POST /api/transaction/submit-webauthn (documented)
Submit Freighter/seed → POST /api/transaction/submit-delegated  ← missing
Submit Phantom        → POST /api/transaction/submit            ← missing
```

### Swap

```
GET_SWAP_QUOTE        → Aquarius API (extension, not Latch backend)
PREPARE_SWAP_TX       → POST /api/transaction/build-swap (Aquarius) OR prepare-sign (other providers)
SETUP_SWAP_RULES      → POST /api/smart-account/setup-swap-rules  ← missing
Submit                → submit-webauthn | submit-delegated | submit
```

### Dapp / external sign

```
Dapp stores payload   → POST /api/sign-payload (documented on Swagger; extension only consumes GET)
Extension loads       → GET /api/sign-payload/{ref} (documented)
Prepare for review    → POST /api/transaction/prepare-sign       ← missing
Submit after approve  → submit-webauthn | submit-delegated | submit
```

---

## Suggested rollout order (extension QA)

1. **T1** — `GET /v1/prices`, `GET /api/accounts`, `GET /api/smart-account/freighter`
2. **T2** — WebAuthn registration + authentication begin/finish
3. **T3** — `POST /api/transaction/build-send`
4. **T4** — `setup-send-rules`, `submit-webauthn`, Freighter GET/POST + `submit-delegated`
5. **T5** — Swap (`build-swap`, `setup-swap-rules`, `prepare-sign`, submit routes)
6. **T6** — `build`, `build-delegated`, `set-active` (wired, limited UI)

Default extension config (no `.env` override):

```bash
PLASMO_PUBLIC_LATCH_API_URL=https://latch-backend.onrender.com
# PLASMO_PUBLIC_LATCH_MARKET_API_URL defaults to https://latch-backend.onrender.com/v1
```

Refresh pinned Swagger: `curl -o doc.json https://latch-backend.onrender.com/swagger/doc.json`

---

## Verification checklist (extension)

- [ ] Import wallet with 12-word recovery phrase (uses freighter GET/POST)
- [ ] Connect Freighter account
- [ ] Connect Phantom account (if still supported)
- [ ] Send XLM / USDC with passkey account (setup-send-rules on first send)
- [ ] Send with Freighter-delegated account (submit-delegated)
- [ ] Swap on Aquarius (setup-swap-rules + build-swap + submit-webauthn)
- [ ] Swap on non-Aquarius provider (prepare-sign path)
- [ ] Dapp `window.latch.openSignRequest` with `payloadRef` (prepare-sign + submit)

---

*Generated from `latch-web-extension` — extension client `backend.ts` and `@latch/types` as of the repo state when this file was added.*
