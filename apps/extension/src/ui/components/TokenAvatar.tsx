import React, { useState } from 'react'

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
  const showImg = Boolean(iconUrl) && !imgFailed

  return (
    <div
      className={[
        'grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/20 text-primary',
        className,
      ].join(' ')}
    >
      {showImg ? (
        <img
          src={iconUrl!}
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
