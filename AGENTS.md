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

| Context        | File                                      | Rule                                                               |
| -------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Popup          | `apps/extension/src/popup/index.tsx`      | Primary UI surface. No key material. Sends messages to background. |
| Side panel     | `apps/extension/src/sidepanel/index.tsx`  | Same rules as popup: no key material; messages to background only. |
| Background SW  | `apps/extension/src/background/index.ts`  | ONLY context allowed to hold keys / sign.                          |
| Content Script | `apps/extension/src/contents/injector.ts` | Proxy only. Bridges dapp ↔ background.                             |

**Never import `@latch/crypto` outside the background service worker.**

### Popup vs side panel (feature parity)

- Wallet UX is implemented in **`apps/extension/src/ui/LatchRoot.tsx`** (and screens under `apps/extension/src/ui/screens/*`). Both **popup** and **side panel** mount the same `LatchRoot` tree with a `surface` prop (`"popup"` | `"sidepanel"`) for layout only.
- **Do not ship flows that work in one surface but not the other** unless you document an explicit, product-approved exception in this file. Onboarding, passkey create/login, settings, and signing flows must behave the same in popup and side panel.
- Avoid long `await` chains between a **user click** and **`navigator.credentials`** (WebAuthn): transient user activation is easier to lose in the side panel than in the popup; keep pre-credential work minimal.
- **Do not swap the whole route for a generic loading screen** between the click and WebAuthn: unmounting the control that received the gesture can prevent the passkey UI from appearing (especially in the side panel). Keep passkey-related screens mounted and use inline disabled/busy state instead (see `routeKeepsUiMountedForWebauthn` in `LatchRoot.tsx`).
- **Side panel WebAuthn**: Chrome often does not complete `navigator.credentials` in the side panel (hangs with no OS prompt). Latch **prefetches** `/begin` on the Create / Passkey-login screens, then runs `startRegistration` / `startAuthentication` in a small **`tabs/passkey-bridge`** extension popup (`chrome.windows` + `chrome.storage.session` handoff). The action toolbar **popup** keeps in-page WebAuthn. Both surfaces use the same backend finish calls.

## Tech Stack

- Package manager: pnpm (workspaces)
- Build orchestration: Turbo
- Extension framework: Plasmo (MV3)
- Language: TypeScript strict mode
- React 18

## Key Conventions

- All inter-context communication via `chrome.runtime.sendMessage`
- Message types defined in `@latch/types` (`MessageType`, `BackgroundMessage`, `BackgroundResponse`)
- Network config via `PLASMO_PUBLIC_*` env vars (including **`PLASMO_PUBLIC_LATCH_API_URL`** for the Latch HTTP API base URL in [`apps/extension/src/background/backend.ts`](apps/extension/src/background/backend.ts); defaults to `https://v0-latch-stellar.vercel.app`. Local dev: set to `http://localhost:3000` and ensure `apps/extension/package.json` `manifest.host_permissions` includes that origin.)
- Stellar network: testnet by default during development
- All icons SVGs should never be written from scratch, prefer importing icons that fit the task.
- Use lucide icons or icon svgs if provided
- Keep UI code clean and modular: avoid large monolithic screen files. Prefer extracting reusable UI building blocks into `apps/extension/src/ui/components/*` or feature-local folders (e.g. `apps/extension/src/ui/swap/components/*`) once a screen grows beyond a few small helpers.
- **Pixel-perfect UI from designs is mandatory**:
  - Do not invent spacing, typography, shadows, gradients, layouts, or components that are not explicitly shown in the design.
  - Prefer using the exact design-provided image/assets when pixel accuracy is required.
  - If any design detail is ambiguous or missing (dimensions, states, interactions), **ask for clarification** before implementing.

## Data fetching & API requests (Plasmo / MV3 best practices)

### Golden rule: fetch in the right context

- **Popup / side panel UI (`apps/extension/src/popup/*`, `apps/extension/src/sidepanel/*`, `apps/extension/src/ui/*`)**: UI-only. No secrets. **Do not** talk to RPCs/APIs directly except for truly public, low-risk reads (and even then, prefer the background for consistency).
- **Content script (`apps/extension/src/contents/*`)**: proxy only. **Never** fetch from the page context and never embed business logic. Bridge dapp ↔ background.
- **Background service worker (`apps/extension/src/background/index.ts`)**: **the place for network + privileged work**:
  - signing, vault access, key derivation
  - RPC/API requests that depend on user state, authorization, rate-limits, or consistency
  - caching, de-duping, retries/backoff, request cancellation

### Architecture: one network “edge” in the background

- **Single entrypoint**: implement all outbound HTTP/RPC calls behind a small background “API layer” (e.g. `apps/extension/src/background/api/*`).
- **UI talks in messages, not URLs**: popup asks for _intent_ (“get balances”, “simulate tx”, “create passkey”) via typed messages; background returns typed responses.
- **No duplicated clients**: avoid creating separate fetch/RPC clients in popup, sidepanel, and background. Centralize in background and expose a message API.

### Fetch implementation guidance (clean + reliable)

- **Use a typed request/response contract**:
  - define message payloads + responses in `@latch/types`
  - keep background handlers narrow and explicit per `MessageType`
- **Make requests cancellable**:
  - popup should send a request id (or use per-view lifecycle)
  - background should support cancellation via `AbortController` when a view unmounts or a request is superseded
- **De-dupe in-flight requests**:
  - if multiple UI renders ask for the same resource, background should reuse the same promise keyed by (endpoint, params, network)
- **Cache where it matters**:
  - cache public, frequently-read data (e.g. account state) in background memory with a short TTL
  - persist only non-sensitive derived data (e.g. last-known balances) to `chrome.storage.local` if it improves UX on cold start
- **Handle errors consistently**:
  - background should map low-level errors into a stable, serializable error shape (code/message) for the UI
  - UI should render friendly states and avoid leaking raw stack traces
- **Respect MV3 service worker constraints**:
  - the SW can be suspended; don’t rely on long-lived in-memory state as the only source of truth
  - persist required non-secret state to `chrome.storage.local` and rehydrate as needed

### What NOT to do (networking)

- Don’t fetch from `apps/extension/src/popup/*` or `apps/extension/src/sidepanel/*` for anything that depends on user state, auth, or signing.
- Don’t add fetch logic to content scripts or the injected page bridge.
- Don’t scatter ad-hoc `fetch()` calls across UI components; route them through background handlers.
- Don’t store secrets/tokens in `chrome.storage` from the UI; secrets live only in the vault and are accessed only in background.

## Refined UI + UX Patterns (extension surfaces)

### Onboarding flow (popup and side panel)

Onboarding and home UI live in **`apps/extension/src/ui/LatchRoot.tsx`**, mounted from **`popup/index.tsx`** and **`sidepanel/index.tsx`** with the same behavior (see [Popup vs side panel](#popup-vs-side-panel-feature-parity)).

State is stored in `chrome.storage.local` (no secrets):

- `latch.setupState`: `"new" | "onboarding_done" | "has_account"`
- `latch.accountPublicKey`: optional (public info only)

Render onboarding until `setupState === "has_account"`, then the dashboard/home UI.

### WebAuthn / passkey (Chrome extension)

The background sends **`chromeExtensionId`** (`chrome.runtime.id` in the service worker) on WebAuthn-related API calls so the **Latch API** can issue and verify credentials for the **`chrome-extension://`** origin.

**Contract for the Latch API** (registration begin/finish, authentication begin/finish, and any route that verifies WebAuthn assertions, e.g. submit-webauthn):

- Accept optional **`chromeExtensionId`** on the JSON body when the client is the extension.
- When `chromeExtensionId` is present, set **`rp.id` / `rpId`** in issued WebAuthn options to that value (not `localhost` or a website hostname).
- On **`verifyRegistrationResponse` / `verifyAuthenticationResponse`** (or equivalent), set **`expectedRPID`** to **`chromeExtensionId`** and **`expectedOrigin`** to **`chrome-extension://<chromeExtensionId>`** (use the same values on **finish** as on **begin**; prefer the **`chromeExtensionId` on the finish body** if session storage is unreliable).

The extension merges **`chromeExtensionId`** into begin, registration finish, authentication finish, and **`submitTxWebauthn`** request bodies from [`backend.ts`](apps/extension/src/background/backend.ts). The UI asserts server-issued **`rp.id` / `rpId`** matches **`chrome.runtime.id`** before calling `startRegistration` / `startAuthentication` (see [`passkey.ts`](apps/extension/src/ui/webauthn/passkey.ts)).

## Styling: TailwindCSS (extension-friendly)

We standardize on **TailwindCSS** for extension UI (popup, side panel, and other extension pages) because it:

- compiles to static CSS at build time (MV3/CSP friendly)
- accelerates design-heavy UI iteration

Guidelines:

- Tailwind config lives at `apps/extension/tailwind.config.ts`
- PostCSS config lives at `apps/extension/postcss.config.js`
- Global Tailwind entry CSS at `apps/extension/src/style.css` (imported from `apps/extension/src/ui/LatchRoot.tsx`, shared by popup and side panel entrypoints)
- Ensure Tailwind `content` includes `./src/**/*.{ts,tsx}` so unused classes purge correctly.

### Font: SF Pro Rounded

We bundle **SF Pro Rounded** so typography is consistent on all platforms (not only macOS/iOS).

- Font files: `apps/extension/assets/fonts/` (weights 400, 500, 600, 700, 800, 900 — no italics)
- `@font-face` declarations: `apps/extension/src/fonts.css` (imported from `apps/extension/src/style.css`)
- Tailwind default sans stack: `fontFamily.sans` in `apps/extension/tailwind.config.ts`
- Use existing Tailwind weight utilities (`font-medium`, `font-semibold`, `font-bold`, `font-extrabold`, etc.); keep `font-mono` for addresses/keys
- SF Pro is Apple-licensed; shipping these files is an explicit product choice

### Theme system (light/dark)

Default theme is **dark**. We use lightweight CSS variables (to keep Tailwind classes stable):

- Tokens live in `apps/extension/src/style.css` as `--latch-*`
- Light mode is enabled by toggling `document.documentElement.classList.toggle("theme-light", true)`
- Persist user preference in `chrome.storage.local`:
  - `latch.theme`: `"dark" | "light"`

Design tokens (current):

- Dark bg: `#1F1F1F`
- Primary: `#FFAD00`
- Dark surface: `#090909`
- Dark border: `#2B2A29` (secondary button + card borders)
- Light bg: `#F5F4F4`
- Light surface: `#FFFFFB`

### Asset paths (keep stable)

Prefer shipping reusable SVG/PNG assets under `apps/extension/assets/` and referencing them by relative URL from UI code:

- Logo: `apps/extension/assets/brand/latch-logo.svg`
- Icons: `apps/extension/assets/icons/*.svg` (e.g. `biometrics.svg`)
- Avatars: `apps/extension/assets/avatars/*.png` (e.g. `success.png`)

Avoid inlining large SVG blobs in TSX; prefer `<img src=\"../../assets/...\">` to keep code/token usage small and consistent across repos.

### Popup polish checklist

- If you see unthemed “white space” during scroll/overscroll, ensure `html, body { background: rgb(var(--latch-bg)); overscroll-behavior: none; }` in `apps/extension/src/style.css`.

### Animations (CSS-only)

Use Tailwind keyframes in `apps/extension/tailwind.config.ts` (no new deps) and apply via `animate-*` classes.

### Content-script UI styling (future)

If/when we render UI inside arbitrary websites:

- Prefer style isolation (Shadow DOM / Plasmo CSUI patterns) to avoid CSS collisions.
- Bundle Tailwind CSS with the injected UI rather than relying on host page styles.

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
