import React from 'react'

import emptyMascotUrl from 'url:../../../../assets/address-book/empty-mascot.svg'

export function AddressBookEmptyState() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
      <div className="flex w-full flex-col items-center gap-[30px]">
        <img
          src={emptyMascotUrl}
          alt=""
          className="h-[156px] w-[186px] shrink-0 object-contain"
          width={186}
          height={156}
          draggable={false}
        />
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <h2 className="w-full text-[22px] font-medium leading-[1.32] tracking-[-0.44px] text-[#fcfcfc]">
            Empty Address Book
          </h2>
          <p className="w-full text-[16px] font-normal leading-[1.36] tracking-[-0.32px] text-[#b3b3b3]">
            Tap the &quot;Add Icon&quot; to start saving your frequently used addresses.
          </p>
        </div>
      </div>
    </div>
  )
}
