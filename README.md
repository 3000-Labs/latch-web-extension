# Latch

Stellar smart account browser extension wallet.

## Stack

- **Extension framework**: [Plasmo](https://docs.plasmo.com) (MV3)
- **Blockchain**: Stellar / Soroban
- **Package manager**: pnpm workspaces
- **Build**: Turbo

## Repo Structure

```
apps/extension   # Browser extension
packages/
  types          # Shared TypeScript types
  stellar        # Stellar/Soroban client
  crypto         # Key derivation & vault encryption
  ui             # Shared UI components
  sdk            # Public dapp API (window.latch)
```

## Getting Started

```bash
pnpm setup
pnpm dev
```

See `AGENTS.md` for architecture decisions and coding conventions.

## Mnemonic import (Stellar smart account)

The extension can derive a Stellar **Ed25519** keypair from a **BIP-39** English mnemonic (optional BIP-39 passphrase) entirely inside the extension service worker:

- **HD path**: `m/44'/148'/0'` (Stellar convention, **SLIP-0010** Ed25519 child key derivation).
- **Libraries**: `@scure/bip39` for mnemonic validation and seed; `ed25519-hd-key` for SLIP-0010; `@stellar/stellar-sdk` `Keypair.fromRawEd25519Seed` for the Stellar `G…` address.

**Security model**

- The mnemonic, BIP-39 seed, and private key material are **never** sent to the Latch backend or logged.
- Only the derived **`gAddress`** (`G…`) is used over HTTPS: `GET /api/smart-account/freighter?gAddress=…` to predict status, then `POST /api/smart-account/freighter` with `{ "gAddress" }` if the smart account is not yet deployed—the same delegated-signer flow as Freighter-backed accounts.
- By default the phrase is **not** persisted. Optional **Remember** stores an **AES-GCM** ciphertext (PBKDF2-derived key from a user-chosen password) in `chrome.storage.local`; the user must **unlock** after an MV3 service-worker restart to load the signing key again.

Implementation lives under `apps/extension/src/background/` (e.g. `stellarMnemonic.ts`, `delegatedLocalSign.ts`, `mnemonicVault.ts`).
