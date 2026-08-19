import '../style.css'

import React from 'react'

import { parseMultisigJoinTokenFromLocation } from '~ui/lib/multisigDeepLink'
import { LatchAppPopup } from '~ui/LatchAppPopup'
import { MultisigJoinPopupRedirect } from '~ui/multisig/MultisigJoinPopupRedirect'

export default function Popup() {
  const joinToken = parseMultisigJoinTokenFromLocation()
  if (joinToken) {
    return <MultisigJoinPopupRedirect token={joinToken} />
  }
  return <LatchAppPopup surface="popup" />
}
