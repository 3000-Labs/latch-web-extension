# Security Policy

Latch is a non-custodial Stellar/Soroban smart-account wallet. Bugs that expose
keys, mnemonics, passkeys, or signing authority are security issues.

## Reporting a vulnerability

**Do not file a public GitHub issue** for security reports.

Please report vulnerabilities through
[GitHub Security Advisories](https://github.com/3000-Labs/latch-web-extension/security/advisories/new)
on this repository. That keeps the report private until maintainers publish a fix.

Include:

- A short description of the issue and impact
- Steps to reproduce, or a proof of concept if you have one
- Affected surface (popup, side panel, background service worker, content
  script / `window.latch`, vault, WebAuthn, etc.)
- Latch / browser versions if known

We will acknowledge reports as soon as we can and keep you updated on status.
There is no bug-bounty program at this time.

## Scope

**In scope** (this repository):

- Extension popup and side panel
- Background service worker (vault, mnemonic, signing)
- WebAuthn / passkey flows in the extension
- Content script and `window.latch` dapp bridge (`@latch/sdk`)
- Local storage of non-secret and encrypted vault material

**Out of scope:**

- Bugs in Chrome, Plasmo, Stellar SDKs, or other **upstream** dependencies —
  report those to the upstream project
- The Latch HTTP API, relayer, or smart contracts — those live in other Latch
  repos
- Issues that require an already-compromised machine or unlocked OS user session
- Social engineering, phishing, or physical access

## Audit status

This repository has **not** had a public third-party security audit. Do not
treat the absence of known issues as a guarantee.

## Contributor rules (short)

When contributing:

- Never log, print, or persist mnemonics, private keys, passwords, or raw
  WebAuthn assertion material
- Keep key material in the background service worker only — do not import
  `@latch/crypto` from popup, side panel, or content scripts
- Treat the content script / `window.postMessage` path as an attack surface:
  validate message types and origins
- Do not weaken Content Security Policy or host-permission defaults without an
  explicit security review
