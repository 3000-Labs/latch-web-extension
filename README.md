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
