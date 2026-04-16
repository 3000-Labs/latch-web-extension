# Latch — AGENTS.md

AI coding agent context for the Latch monorepo.

## What is Latch

Latch is a Stellar/Soroban smart account browser extension wallet built with Plasmo.

## Monorepo Layout

```
apps/
  extension/   # Plasmo browser extension (MV3)
  web/         # Landing site (future)
packages/
  types/       # Shared TS types — no runtime code
  stellar/     # Stellar/Soroban client logic (XDR, RPC, tx lifecycle)
  crypto/      # Key derivation + AES-GCM vault — background SW only
  ui/          # Shared React UI components
  sdk/         # Public dapp API (window.latch)
```

## Extension Execution Contexts

| Context | File | Rule |
|---|---|---|
| Popup | `apps/extension/src/popup/index.tsx` | No key material. Sends messages to background. |
| Background SW | `apps/extension/src/background/index.ts` | ONLY context allowed to hold keys / sign. |
| Content Script | `apps/extension/src/contents/injector.ts` | Proxy only. Bridges dapp ↔ background. |

**Never import `@latch/crypto` outside the background service worker.**

## Tech Stack

- Package manager: pnpm (workspaces)
- Build orchestration: Turbo
- Extension framework: Plasmo (MV3)
- Language: TypeScript strict mode
- React 18

## Key Conventions

- All inter-context communication via `chrome.runtime.sendMessage`
- Message types defined in `@latch/types` (`MessageType`, `BackgroundMessage`, `BackgroundResponse`)
- Network config via `PLASMO_PUBLIC_*` env vars
- Stellar network: testnet by default during development

## Commands

```bash
pnpm setup       # install all deps
pnpm dev         # start extension in watch mode
pnpm build       # production build
pnpm lint        # lint all packages
pnpm test        # run all tests
pnpm format      # prettier across repo
```

## What NOT to do

- Do not add MetaMask-style middleware stacks — not needed for Stellar
- Do not sign transactions in the popup or content script
- Do not store raw private keys in chrome.storage — vault must be encrypted
- Do not add Redux — use context or Zustand at the right scope
