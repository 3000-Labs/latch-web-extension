import React from 'react'

import importFailedUrl from 'url:../../../../assets/onboarding/web/import-failed.svg'

export function SendFailureIllustration() {
  return (
    <img
      src={importFailedUrl}
      alt=""
      className="h-[246.583px] w-[276px] shrink-0 animate-pop"
      width={276}
      height={247}
      draggable={false}
    />
  )
}
