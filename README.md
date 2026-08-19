# Latch

Non-custodial **Stellar / Soroban smart-account** wallet as a Chrome MV3
browser extension ([Plasmo](https://docs.plasmo.com)).

New here? Start with [CONTRIBUTING.md](CONTRIBUTING.md).

## Stack

- **Extension**: Plasmo (MV3), React 18
- **Packages**: pnpm workspaces + Turbo
- **Chain**: Stellar / Soroban (testnet by default in development)

## Repository layout

```
apps/extension    # Browser extension (popup, side panel, background, content script)
packages/
  types           # Shared TypeScript types (no runtime)
  stellar         # Stellar / Soroban client
  swap            # Swap quote / build helpers
  sdk             # Public dapp API (window.latch)
  crypto          # Stub — vault and mnemonic live in the background service worker
  ui              # Stub — UI lives in apps/extension/src/ui
```

Architecture and coding conventions: [AGENTS.md](AGENTS.md).

## Prerequisites

- Node.js 20 (`nvm use` — see `.nvmrc`)
- pnpm 10.33.0
- Chrome (to load the unpacked extension)

## Getting started

```bash
pnpm setup
pnpm dev
```

Then in Chrome: `chrome://extensions` → Developer mode → **Load unpacked** →
select `apps/extension/build/chrome-mv3-dev`.

Optional env overrides: copy [`apps/extension/.env.example`](apps/extension/.env.example)
to `apps/extension/.env`. All `PLASMO_PUBLIC_*` values are public config, not
secrets. Defaults talk to the hosted Latch API; see CONTRIBUTING for local API.

| Command             | Purpose                           |
| ------------------- | --------------------------------- |
| `pnpm setup`        | Install workspace dependencies    |
| `pnpm dev`          | Plasmo watch build                |
| `pnpm build`        | Production / typecheck via Turbo  |
| `pnpm lint`         | ESLint                            |
| `pnpm test`         | Vitest (extension, stellar, swap) |
| `pnpm format`       | Prettier write                    |
| `pnpm format:check` | Prettier check (CI)               |

## Mnemonic import (Stellar smart account)

The extension can derive a Stellar **Ed25519** keypair from a **BIP-39** English
mnemonic (optional BIP-39 passphrase) entirely inside the extension service
worker:

- **HD path**: `m/44'/148'/0'` (Stellar convention, **SLIP-0010** Ed25519 child
  key derivation).
- **Libraries**: `@scure/bip39` for mnemonic validation and seed;
  `ed25519-hd-key` for SLIP-0010; `@stellar/stellar-sdk`
  `Keypair.fromRawEd25519Seed` for the Stellar `G…` address.

**Security model**

- The mnemonic, BIP-39 seed, and private key material are **never** sent to the
  Latch backend or logged.
- Only the derived **`gAddress`** (`G…`) is used over HTTPS:
  `GET /api/smart-account/freighter?gAddress=…` to predict status, then
  `POST /api/smart-account/freighter` with `{ "gAddress" }` if the smart account
  is not yet deployed — the same delegated-signer flow as Freighter-backed
  accounts.
- By default the phrase is **not** persisted. Optional **Remember** stores an
  **AES-GCM** ciphertext (PBKDF2-derived key from a user-chosen password) in
  `chrome.storage.local`; the user must **unlock** after an MV3 service-worker
  restart to load the signing key again.

Implementation lives under `apps/extension/src/background/` (e.g.
`stellarMnemonic.ts`, `delegatedLocalSign.ts`, `mnemonicVault.ts`).

## More

- [CONTRIBUTING.md](CONTRIBUTING.md) — setup, PRs, AI policy
- [SECURITY.md](SECURITY.md) — vulnerability disclosure
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [LICENSE](LICENSE) — MIT (source). Bundled SF Pro Rounded fonts: see [NOTICE](NOTICE)
- [AGENTS.md](AGENTS.md) — execution contexts and conventions
