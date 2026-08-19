# Latch backend — cosign multisig extension spec

> **Status: superseded / not shipped.** The live Latch extension multisig path is cookie-session **`/api/multisig/*`** (draft → join → deploy → proposals). Cosign `/v1/cosign/*` + V1 JWT auth remain as reference design and unwired source trees; do not treat this document as the active integration contract.

**Audience:** Backend engineers / agents reading historical cosign context for a possible future revival.

**Extension client (unwired):** [`apps/extension/src/background/api/cosign/`](apps/extension/src/background/api/cosign/), [`apps/extension/src/background/cosign/`](apps/extension/src/background/cosign/)

**Reference:** [`references/multisig-cosign-flow 2.md`](references/multisig-cosign-flow%202.md), pinned Swagger [`doc.json`](doc.json)

**Previous status:** Extension targeted this contract; items marked **NEW** were required before seamless join would work. That path is unwired from `background/index.ts` and `LatchRoot`.

---

## Context

> Historical note: this document described a migration **from** cookie-session `/api/multisig/*` **to** JWT blind-index cosign. That migration did not ship. The extension has rolled back to `/api/multisig/*` as the only live path.

The sections below remain as design notes for a possible future cosign revival.

---

## 1. Existing `/v1` endpoints (confirm contract)

All require `Authorization: Bearer <access_token>` unless noted.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/memberships` | Announce shared-wallet membership |
| GET | `/v1/memberships?member_blind_id=` | Discover wallets for a member |
| PUT | `/v1/wck-bundles/:pickup_key` | Upload sealed WCK bundle |
| GET | `/v1/wck-bundles/:pickup_key` | Fetch sealed WCK bundle |
| POST | `/v1/cosign/requests` | Create pending cosign request |
| GET | `/v1/cosign/requests?queue_index=` | List pending requests for queue |
| GET | `/v1/cosign/requests/:id` | Get request + signatures |
| DELETE | `/v1/cosign/requests/:id` | Cancel pending request |
| POST | `/v1/cosign/requests/:id/signatures` | Attach partial signature |
| POST | `/v1/cosign/requests/:id/submission` | Record on-chain tx hash |
| GET | `/v1/history?c_address=&network=&limit=` | Completed on-chain txs |

### Response envelope

**Success:** `{ "data": <payload> }`

**Error:** `{ "error": { "code": string, "message": string } }`

The extension unwraps `data` in [`v1Client.ts`](apps/extension/src/background/api/v1Client.ts).

### XDR fields (clarification)

Despite Swagger descriptions mentioning "encrypted tx", the extension treats:

- `unsigned_tx_xdr` — **base64** Stellar `TransactionEnvelope` XDR (unsigned; Soroban auth entries present but unsigned).
- `auth_entry_xdr` — **base64** `SorobanAuthorizationEntry` XDR with signature attached for one signer.

Privacy is from **blind IDs** (`queue_index`, `blind_signer_id`), not server-side encryption of these blobs.

### Build API addition (cookie `/api/*`)

`POST /api/transaction/build-send` (and related build routes) should return **`unsignedTxXdr`** (base64) when `smartAccountAddress` is a multisig account, so the extension can post it to `/v1/cosign/requests` without re-encoding client-side.

If already present under another field name, document the alias in Swagger.

---

## 2. NEW — Transport pubkey relay (required for join)

Enables members to register a device transport public key before the creator seals the WCK bundle.

### `POST /v1/join-relays`

**Auth:** Bearer JWT

**Body:**

```json
{
  "invite_token": "uuid-or-opaque-token",
  "transport_pubkey_b64": "base64(raw P-256 ECDH public key, 65 bytes uncompressed)"
}
```

**Response:** `{ "data": { "message": "ok" } }`

**Rules:**

- `invite_token` is opaque (extension-generated UUID); max 128 chars.
- Idempotent per `(invite_token)` — later POST overwrites `transport_pubkey_b64`.
- Store `member_blind_id` if client sends it (optional field) for creator UI hints.

Optional body field:

```json
{ "member_blind_id": "64-char hex SHA-256 of signer pubkey bytes" }
```

### `GET /v1/join-relays/:invite_token`

**Auth:** Bearer JWT (creator polls)

**Response:**

```json
{
  "data": {
    "invite_token": "...",
    "transport_pubkey_b64": "...",
    "member_blind_id": "...",
    "created_at": "RFC3339",
    "updated_at": "RFC3339"
  }
}
```

**404** when no relay exists yet.

### `DELETE /v1/join-relays/:invite_token`

**Auth:** Bearer JWT

**Response:** `{ "data": { "message": "ok" } }`

Creator calls after WCK bundle is stored and membership announced.

---

## 3. JWT auth for extension passkey users

Cosign `/v1/*` requires Bearer tokens. Extension onboarding uses cookie `/api/webauthn/*` today.

### Required flows

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/auth/challenge` | Issue nonce for wallet sign-in |
| `POST /v1/auth/sign-in` | Exchange signed challenge for tokens |
| `POST /v1/auth/refresh` | Rotate refresh token |

### Extension WebAuthn sign-in

**Challenge request:**

```json
{
  "wallet": "<smart_account_C_address or stable wallet id>",
  "key_type": "webauthn"
}
```

**Sign-in request** (after WebAuthn assertion):

```json
{
  "wallet": "...",
  "key_type": "webauthn",
  "nonce": "<from challenge>",
  "client_data_json": "<base64>",
  "authenticator_data": "<base64>",
  "passkey_signature": "<base64 ASN.1 DER P-256>"
}
```

When the client is the Chrome extension, accept optional **`chromeExtensionId`** on challenge/sign-in (same as `/api/webauthn/*`):

- Set WebAuthn `rp.id` / expected RP ID to `chromeExtensionId`.
- Set `expectedOrigin` to `chrome-extension://<chromeExtensionId>`.

### Token response

```json
{
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 900
  }
}
```

Extension stores refresh token in `chrome.storage.local` and refreshes before cosign calls.

### Identity model

**Per signing identity:** JWT should be obtained using the passkey / G-address that will produce cosign `auth_entry_xdr` signatures. One extension install may hold multiple token pairs keyed by `wallet`.

---

## 4. Blind ID crypto (must match extension byte-for-byte)

See [`references/multisig-cosign-flow 2.md` §1](references/multisig-cosign-flow%202.md).

| Identifier | Derivation |
|------------|------------|
| `member_blind_id` | `hex(SHA-256(signerPublicKeyBytes))` |
| `pickup_key` | `hex(SHA-256(utf8(walletCAddress)))` |
| `queue_index` | `hex(HMAC-SHA256(key=WCK, msg=utf8(walletCAddress)))` |
| `blind_signer_id` | `hex(HMAC-SHA256(key=WCK, msg=signerPublicKeyBytes))` |

**Signer public key bytes:**

- WebAuthn: first 65 bytes of `keyDataHex` (uncompressed P-256)
- Ed25519: 32-byte raw public key
- Delegated G: 32-byte ed25519 public key bytes (StrKey decoded)

Server validates identifiers are **64-char lowercase hex** (or `wallet_ref` is `C...` StrKey).

---

## 5. Cosign request lifecycle

1. **Propose:** `POST /v1/cosign/requests` with `{ queue_index, unsigned_tx_xdr, network, threshold }`.
2. **List:** `GET /v1/cosign/requests?queue_index=` — include `signatures[]`, `signature_count`.
3. **Sign:** `POST /v1/cosign/requests/:id/signatures` with `{ blind_signer_id, auth_entry_xdr }`.
4. **Threshold:** Client compares `signature_count >= threshold` (server does not enforce).
5. **Execute:** Client assembles tx, submits on-chain, then `POST .../submission` with `{ tx_hash }`.

**Dedup:** Reject duplicate `(request_id, blind_signer_id)` signature rows.

**Status values:** `pending`, `submitted`, `cancelled`, `expired`.

---

## 6. Membership discovery

1. Creator: `POST /v1/memberships` with `{ wallet_ref, member_blind_ids: [...] }`.
2. Creator: `PUT /v1/wck-bundles/:pickup_key` with `{ bundle: "<sealed JSON>" }`.
3. Member: `GET /v1/memberships?member_blind_id=` → list `wallet_ref` values.
4. Member: `GET /v1/wck-bundles/:pickup_key` → unseal WCK locally.
5. Member: **must verify on-chain** they are a signer on `wallet_ref` before trusting announcement.

Membership announcements are **unauthenticated content** — clients must verify on-chain.

---

## 7. Smoke test checklist

| # | Test |
|---|------|
| 1 | `POST /v1/auth/challenge` + WebAuthn sign-in with `chromeExtensionId` → tokens |
| 2 | `POST /v1/join-relays` + `GET /v1/join-relays/:token` round-trip |
| 3 | `POST /v1/memberships` + `GET /v1/memberships?member_blind_id=` |
| 4 | `PUT` + `GET /v1/wck-bundles/:pickup_key` |
| 5 | Full cosign: create → sign → list → submission |
| 6 | `GET /v1/history?c_address=C...` |
| 7 | `POST /api/transaction/build-send` returns `unsignedTxXdr` for multisig |

---

## 8. Out of scope (backend)

- Push notifications to browser extensions (Expo-only today; extension polls).
- `/api/multisig/drafts/*` and `/api/multisig/proposals/*` — deprecated for extension; may remain for web app until removed.
