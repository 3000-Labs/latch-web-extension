import React, { useEffect, useState } from 'react'

import stellarIconUrl from 'url:../../../assets/icons/stellar.svg'

export function TokenAvatar({
  symbol,
  iconUrl,
  className = 'h-10 w-10',
}: {
  symbol: string
  iconUrl?: string | null
  /** Tailwind size classes for the circle container */
  className?: string
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
        'grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/20 text-primary',
        className,
      ].join(' ')}
    >
      {showImg ? (
        <img
          src={resolvedSrc!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="text-sm font-extrabold">{letter}</span>
      )}
    </div>
  )
}

