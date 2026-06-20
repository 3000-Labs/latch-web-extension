import React from 'react'

export function SendRecipientAddressField({
  value,
  onChange,
  onKeyDown,
}: {
  value: string
  onChange: (next: string) => void
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <label
        htmlFor="send-recipient-address"
        className="text-base font-semibold leading-[1.31] tracking-[-0.16px] text-[#fcfcfc]"
      >
        Recipient Address
      </label>
      <input
        id="send-recipient-address"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="G... or C ..."
        className="h-[52px] w-full rounded-xl border border-stroke bg-transparent px-3 text-base leading-[1.36] tracking-[-0.32px] text-[#fcfcfc] outline-none placeholder:text-[#b3b3b3]"
      />
    </div>
  )
}
