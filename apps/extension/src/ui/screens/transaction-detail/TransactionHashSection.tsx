import React from 'react'

export function TransactionHashSection({ hash }: { hash: string }) {
  return (
    <div className="mt-8">
      <div className="text-[17px] font-semibold text-white px-1">Transaction Hash</div>
      <div className="mt-3 break-all rounded-[16px] bg-[#161616] px-4 py-4 text-[15px] font-medium leading-relaxed text-[#8E8E93]">
        {hash}
      </div>
    </div>
  )
}
