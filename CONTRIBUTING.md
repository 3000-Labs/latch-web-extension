# Contributing to Latch

Latch is a non-custodial Stellar/Soroban smart-account **browser extension**
wallet built with Plasmo (MV3). This monorepo is the extension plus shared
TypeScript packages.

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Security reports go to
[SECURITY.md](SECURITY.md) — never public issues.

## Workflow

1. **Open (or find) an issue first.** Pull requests without a prior issue are
   closed unless they are trivial (typos, broken links, obvious one-line fixes).
2. Fork the repo and branch from `main` (`fix/…`, `feat/…`, `chore/…`).
3. Keep PRs focused — no mixed refactors and features.
4. Fill in the pull request template and link the issue.

## Prerequisites

| Tool    | Version | Notes                                      |
| ------- | ------- | ------------------------------------------ |
| Node.js | 20      | `nvm use` reads [`.nvmrc`](.nvmrc)         |
| pnpm    | 10.33.0 | Matches `packageManager` in `package.json` |
| Chrome  | Latest  | Load the unpacked extension                |

## Getting started

```bash
git clone https://github.com/3000-Labs/latch-web-extension.git
cd latch-web-extension
nvm use
pnpm setup
```

Copy public env defaults if you need to override them:

```bash
cp apps/extension/.env.example apps/extension/.env
```

`.env` is gitignored. Values are `PLASMO_PUBLIC_*` (not secrets). The extension
talks to the Latch API; defaults are already baked in for remote testnet/dev.
Local API work: set `PLASMO_PUBLIC_LATCH_API_URL=http://localhost:3000` and
keep that origin in `apps/extension/package.json` `manifest.host_permissions`.

### Run the extension

```bash
pnpm dev
```

Plasmo writes a loadable unpacked build to:

`apps/extension/build/chrome-mv3-dev`

**Load in Chrome:**

1. Open `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked**
3. Select `apps/extension/build/chrome-mv3-dev`

A production build lives at `apps/extension/build/chrome-mv3-prod` after
`pnpm build`.

### Hot reload

- **Popup / side panel UI** usually hot-reloads via Plasmo.
- **Background service worker** and **content script** changes often need a
  reload of the extension on `chrome://extensions`.
- Do not swap the whole route for a generic loading screen between a user click
  and WebAuthn — see [AGENTS.md](AGENTS.md).

## Key commands

```bash
pnpm setup         # install workspace deps
pnpm dev           # Plasmo watch (extension)
pnpm build         # production / typecheck packages via Turbo
pnpm lint          # ESLint via Turbo (every package that defines lint)
pnpm test          # Vitest via Turbo (packages that define test)
pnpm format        # Prettier write
pnpm format:check  # Prettier check (CI)
```

Turbo only runs `test` in packages that define a `test` script today:

- `@latch/extension` (`apps/extension`)
- `@latch/stellar`
- `@latch/swap`

`@latch/types` is types-only. `@latch/crypto` and `@latch/ui` are stubs.
`@latch/sdk` is a thin `window.latch` wrapper and is not unit-tested yet.

## Architecture

Wallet UX is one React tree (`apps/extension/src/ui/LatchRoot.tsx`) mounted from
both **popup** and **side panel**.

| Context        | Location                                  | Rule                                                  |
| -------------- | ----------------------------------------- | ----------------------------------------------------- |
| Popup          | `apps/extension/src/popup/`               | UI only. No key material. Messages to background.     |
| Side panel     | `apps/extension/src/sidepanel/`           | Same as popup.                                        |
| Background SW  | `apps/extension/src/background/`          | **Only** place that may hold keys or sign.            |
| Content script | `apps/extension/src/contents/injector.ts` | Proxy only. Bridges dapp `window.latch` ↔ background. |

**Never import `@latch/crypto` outside the background service worker.**

Monorepo:

```
apps/extension/     # Plasmo MV3 extension
packages/types/     # Shared TS types
packages/stellar/   # Stellar/Soroban client
packages/swap/      # Swap quotes / build helpers
packages/sdk/       # Public dapp API (window.latch)
packages/crypto/    # Stub — vault/mnemonic live in the background SW
packages/ui/        # Stub — UI lives in apps/extension/src/ui
```

Details, fetch rules, and popup/side-panel parity live in [AGENTS.md](AGENTS.md).
Do not duplicate that file here; follow it.

## Linting and formatting

- ESLint: root [`eslint.config.js`](eslint.config.js)
- Prettier: [`.prettierrc`](.prettierrc) — no semicolons, single quotes,
  trailing commas `es5`, width 100

Run `pnpm lint` and `pnpm format:check` before you open a PR.

## Testing

Vitest. Prefer `*.test.ts` next to the code you change.

Before opening a PR: `pnpm lint` and `pnpm test` must pass. `pnpm build` must
also pass (CI runs it).

## Security (contributors)

Latch handles mnemonics, passkeys, and transaction signing.

- Never log or persist private keys, seed phrases, passwords, or raw WebAuthn
  assertion material
- Do not import `@latch/crypto` from popup, side panel, or content scripts
- Validate dapp messages in the content script / background — that path is an
  attack surface
- Do not weaken CSP or host permissions without an explicit review
- Report vulnerabilities per [SECURITY.md](SECURITY.md), not as public issues

## Pull requests

- Link the issue (`Fixes #123`)
- Include screenshots for UI changes (popup **and** side panel if the flow
  exists in both)
- Do not mix unrelated refactors into a feature PR
- **AI-assisted contributions are welcome.** The human who opens the PR owns
  the diff and must review it. Low-effort, unreviewed AI output will be closed
  without a line-by-line review — not nitpicked into shape by maintainers.

**CI on every PR:** typos, then lint, Prettier check, tests, and production
build. Docs-only PRs still get a green `ci` job; the heavy steps are skipped
but the check always reports.

## Maintainer checklist (GitHub settings)

Not files — configure on `3000-Labs/latch-web-extension`:

- Ruleset on `main`: no force-push, PR required, squash-merge only, required
  checks named `typos` and `ci`, do **not** require the branch to be up to date
  with `main`
- Confirm squash actually enforces (org owner/admin bypass can silently allow
  merge commits)
- Enable private vulnerability reporting

## Further reading

| Topic                      | Location                                                   |
| -------------------------- | ---------------------------------------------------------- |
| Architecture / conventions | [AGENTS.md](AGENTS.md)                                     |
| Security disclosure        | [SECURITY.md](SECURITY.md)                                 |
| License                    | [LICENSE](LICENSE)                                         |
| Bundled fonts              | [NOTICE](NOTICE)                                           |
| Public env example         | [apps/extension/.env.example](apps/extension/.env.example) |
