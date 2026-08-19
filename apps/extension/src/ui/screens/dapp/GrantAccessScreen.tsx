import type { Network, PendingDappRequestKind } from '@latch/types'

function hostnameFromOrigin(origin: string): string {
  try {
    return new URL(origin).hostname
  } catch {
    return origin
  }
}

function truncateAddress(address: string, left = 6, right = 4): string {
  if (address.length <= left + right + 3) return address
  return `${address.slice(0, left)}...${address.slice(-right)}`
}

export function GrantAccessScreen({
  origin,
  kind,
  network,
  smartAccountAddress,
  busy,
  onApprove,
  onReject,
}: {
  origin: string
  kind: PendingDappRequestKind
  network: Network
  smartAccountAddress: string
  busy?: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const hostname = hostnameFromOrigin(origin)
  const permissionLabel =
    kind === 'getPublicKey'
      ? 'View your wallet address'
      : kind === 'externalSignReview' || kind === 'signTransaction'
        ? 'Sign transactions'
        : 'Connect to your wallet'

  return (
    <div className="flex flex-col animate-screenIn flex-1 min-h-0">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold tracking-tight">Connect to Latch</h2>
        <p className="mt-2 text-sm text-muted">This site wants to connect to your wallet</p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-4 shadow-soft">
        <div className="text-xs font-bold text-muted">Site</div>
        <div className="mt-2 text-sm font-extrabold break-all">{hostname}</div>
        <div className="mt-1 text-xs text-muted break-all">{origin}</div>

        <div className="mt-4 text-xs font-bold text-muted">Network</div>
        <div className="mt-1 text-sm font-bold capitalize">{network}</div>

        <div className="mt-4 text-xs font-bold text-muted">Smart account</div>
        <div className="mt-1 font-mono text-sm font-bold">
          {truncateAddress(smartAccountAddress)}
        </div>

        <div className="mt-4 text-xs font-bold text-muted">Permission</div>
        <div className="mt-1 text-sm font-bold">{permissionLabel}</div>
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className="h-12 w-full rounded-full bg-primary text-base font-extrabold text-black shadow-soft disabled:opacity-60"
        >
          {busy ? 'Connecting…' : 'Connect'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className="h-12 w-full rounded-full border border-border bg-surface text-base font-bold text-fg shadow-soft disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
