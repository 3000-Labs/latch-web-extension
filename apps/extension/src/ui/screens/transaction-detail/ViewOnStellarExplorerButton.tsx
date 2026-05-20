import React from 'react'
import { ExternalLink } from 'lucide-react'

export function ViewOnStellarExplorerButton({ href }: { href: string }) {
  return (
    <div className="mt-8 mb-4">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#FFAD00] text-[16px] font-bold text-black transition-opacity hover:opacity-90"
      >
        View On Stellar Explorer
        <ExternalLink className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
      </a>
    </div>
  )
}
