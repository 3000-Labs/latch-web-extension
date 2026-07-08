import { useEffect } from 'react'

import { buildMultisigInviteUrl } from '../lib/multisigDeepLink'

/** Legacy popup.html links open the dedicated join tab instead. */
export function MultisigJoinPopupRedirect({ token }: { token: string }) {
  useEffect(() => {
    const url = buildMultisigInviteUrl(token)
    void chrome.tabs.create({ url }).finally(() => {
      window.close()
    })
  }, [token])

  return (
    <div className="flex h-[600px] w-[360px] items-center justify-center bg-bg px-6 text-center text-sm text-muted">
      Opening multisig invite…
    </div>
  )
}
