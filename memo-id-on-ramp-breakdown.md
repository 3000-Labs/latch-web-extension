You already have a solid prototype of this exact flow in `references/latch-test-ground` and `references/latch-api-master`. Below is how that maps to your three questions.

---

## 1. Best way to get a memo that works with on-ramps

**Recommended pattern (what you already sketched in the references): per-intent `MEMO_ID`, not a permanent per-user memo.**

### Flow

1. User taps **Fund** → picks an on-ramp (e.g. MoonPay).
2. Extension asks the backend to create an **on-ramp intent**, passing the user’s **C-address**.
3. Backend:
   - Generates a **unique numeric memo** (`MEMO_ID` style).
   - Stores `memo_id → destination_c_address` (plus fiat amount, status, etc.).
   - Returns `poolAddress` + `memoId` + widget URL / session token.
4. On-ramp is opened with:
   - **destination** = your shared pool **G-address**
   - **tag/memo** = that `memoId`
5. Relayer watches the pool, matches the on-chain memo to the intent, then routes XLM to the C-address.

That is already implemented as:

```9:22:references/latch-test-ground/lib/on-ramp/memo.ts
export async function generateUniqueMemoId(
  exists: (memoId: string) => Promise<boolean>
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const memoId = String(crypto.randomInt(MEMO_MIN, MEMO_MIN + MEMO_SPAN));
    if (!(await exists(memoId))) {
      return memoId;
    }
  }
  // ...
}
```

```25:26:references/latch-test-ground/lib/on-ramp/widget-url.ts
  search.set("walletAddress", params.poolAddress);
  search.set("walletAddressTag", params.memoId);
```

And for MoonPay Platform SDK:

```123:126:references/latch-test-ground/lib/on-ramp/useMoonPayOnRamp.ts
          wallet: {
            address: sess.poolAddress,
            tag: sess.memoId,
          },
```

MoonPay’s docs call this the same thing: `walletAddressTag` (widget) / `wallet.tag` (platform) — “secondary wallet identifier/memo for coins such as … XLM”.

### Why this memo shape is the right one

| Choice                                         | Verdict                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Numeric `MEMO_ID` (what you generate)**      | Best for on-ramps. Fits Stellar `MEMO_ID`, MoonPay `tag`, XRP-style destination tags.                         |
| **Per-intent unique memo**                     | Best for reconciliation, expiry, and avoiding “all deposits for Alice forever share one memo” collisions.     |
| **Permanent per-user memo**                    | Simpler UX, worse ops: reuse forever, harder expiry/abuse handling, one leaked memo = forever routing risk.   |
| **`MEMO_TEXT` (string like `"latch-abc"`)**    | Riskier: length limits (28 bytes), encoding quirks, weaker on-ramp support.                                   |
| **Muxed `M…` address (ID baked into address)** | Elegant on Stellar, but most fiat on-ramps still want `G…` + separate tag. Don’t bet the product on this yet. |

### Implementation rules that matter

- **Generate on the backend**, never in the extension. Persist with a **UNIQUE** constraint on `memo_id` (you already do in `webapp.on_ramp_intents`).
- **Pass it into the on-ramp as a locked field** — don’t let the user edit address/tag. Your widget URL already sets `showWalletAddressForm=true` so they can _see_ it but not change it.
- **Also store `externalTransactionId` = intent id** so MoonPay webhooks give you a second correlation path if the on-chain memo is missing/wrong.
- **Relayer should match**: successful payment to pool + memo == open intent + amount within tolerance → credit C-address → mark intent completed. Treat missing/unknown memos as ops alerts, not auto-credit.

For the extension product path: Fund button → list of on-ramps → `CreateIntent(destinationCAddress)` via background message → open signed widget / platform session. Same pattern as the test-ground, just wired through Latch’s background API layer.

---

## 2. Is pool G-address + memo + relayer the best approach?

**Yes — for smart accounts (C-addresses) with today’s fiat on-ramps, this is the standard and most practical approach.**

### Why you need it

Latch wallets are **Soroban smart accounts (`C…`)**. Almost all fiat on-ramps (MoonPay, Coinbase Onramp, Ramp, etc.) only know how to send **classic Stellar payments to `G…` accounts**. They generally cannot:

- call a contract,
- invoke your smart-account “receive” path,
- or treat a C-address as a normal payment destination.

So: **on-ramp → shared custodial/ops G pool → your relayer → user’s C-address** is the correct bridge.

### Compared to alternatives

| Approach                       | Pros                                                                               | Cons                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Shared pool + memo (yours)** | One funded G account; works with MoonPay today; matches your existing intent table | Relayer complexity; custody of pool; memo-missing edge cases                  |
| **Per-user deposit G address** | No memo needed                                                                     | Create/fund many accounts; key management; expensive; still need a sweep to C |
| **Direct on-ramp → C**         | Ideal UX                                                                           | Not supported by typical on-ramps today                                       |
| **SEP-24 / anchor deposit**    | More “Stellar-native”                                                              | Different product surface; still often lands on G + memo                      |
| **Muxed accounts**             | Memo-in-address                                                                    | Weak on-ramp support                                                          |

### Efficiency caveats (worth designing for now)

Your architecture is right; efficiency depends on relayer quality:

1. **Don’t only poll Horizon every N seconds forever** — combine **on-ramp webhooks** (MoonPay tx status) with **Horizon/SSE or indexed payments** for finality.
2. **Idempotency** — credit once per `(horizon_tx_id)` / intent; never re-route the same payment.
3. **Amount matching** — fiat → XLM amount won’t match the quote exactly; use tolerance + store expected crypto amount when the quote settles.
4. **Intent TTL** — expire unused memos so a late/wrong payment doesn’t hit a recycled mapping (you generate huge random IDs, which helps, but still expire intents).
5. **Ops for orphan deposits** — payment with no/unknown memo must go to a manual recovery queue.
6. **Custody** — the pool G secret is high-value; keep it only on the relayer/backend, never in the extension (aligned with Latch’s “keys only in background / server” model).

So: **best approach for smart-account funding via third-party on-ramps = yes.** It’s not a workaround; it’s the industry pattern when the destination isn’t a plain G account.

---

## Practical recommendation for Latch

Stick with what you’ve already prototyped:

1. **Per-fund-click intent** with unique numeric memo.
2. **Shared pool G-address** as the only address on-ramps ever see.
3. **Backend owns memo generation + intent store + relayer**.
4. **Extension only**: pick provider → create intent → open on-ramp UI → show “pending / completed” from intent status.
5. When adding more on-ramps, treat each as an adapter: same `memoId` + `poolAddress`, different SDK/URL field names.

That is the cleanest path from “Fund on home” to “XLM on the user’s C-address” given smart accounts and current on-ramp constraints.
