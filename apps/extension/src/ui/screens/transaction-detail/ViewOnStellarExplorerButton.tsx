import React from 'react'
import { ExternalLink } from 'lucide-react'

export function ViewOnStellarExplorerButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-extrabold text-black shadow-soft"
    >
      View On Stellar Explorer
      <ExternalLink className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
    </a>
  )
}
