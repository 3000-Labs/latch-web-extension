import { LatchLoadingMark } from './LatchLoadingMark'

export function LatchLoadingOverlay({ label }: { label: string }) {
  return (
    <>
      <div className="absolute inset-0 bg-[#121212]/90" aria-hidden />
      <div className="absolute left-1/2 top-[calc(50%-0.33px)] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
        <LatchLoadingMark />
        <p className="text-[16px] font-semibold leading-[1.31] tracking-[-0.16px] text-[#fbfbfb]">
          {label}
        </p>
      </div>
    </>
  )
}
