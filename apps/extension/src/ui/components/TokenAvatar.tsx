import React, { useEffect, useState } from 'react'

import stellarIconUrl from 'url:../../../assets/icons/stellar.svg'

export function TokenAvatar({
  symbol,
  iconUrl,
  className = 'h-10 w-10',
  rounded = 'rounded-full',
}: {
  symbol: string
  iconUrl?: string | null
  /** Tailwind size classes for the circle container */
  className?: string
  rounded?: string
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const letter = (symbol?.trim()?.[0] ?? '?').toUpperCase()
  const isXlm = symbol.trim().toUpperCase() === 'XLM'
  const bundledSrc = isXlm ? stellarIconUrl : null
  // Native XLM always uses the bundled Stellar mark (ignore list/CoinCap data URLs).
  const resolvedSrc =
    isXlm && bundledSrc && !imgFailed
      ? bundledSrc
      : iconUrl && !imgFailed
        ? iconUrl
        : bundledSrc && !imgFailed
          ? bundledSrc
          : null
  const showImg = Boolean(resolvedSrc)

  useEffect(() => {
    setImgFailed(false)
  }, [iconUrl, symbol])

  return (
    <div
      className={[
        'grid shrink-0 place-items-center overflow-hidden bg-black/60 p-1 border border-border/30 text-fg',
        rounded,
        className,
      ].join(' ')}
    >
      {showImg ? (
        <img
          src={resolvedSrc!}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="text-sm font-extrabold">{letter}</span>
      )}
    </div>
  )
}
