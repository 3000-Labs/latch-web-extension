import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export function ReceiveQrCodeCard({ value, logoUrl }: { value: string; logoUrl?: string | null }) {
  const imageSettings = logoUrl
    ? {
        src: logoUrl,
        x: undefined,
        y: undefined,
        height: 38,
        width: 38,
        excavate: true,
      }
    : undefined

  return (
    <div className="flex justify-center my-6">
      <div className="bg-white p-5 rounded-[2.5rem] shadow-lg flex items-center justify-center border border-white">
        <QRCodeSVG
          value={value}
          size={180}
          level="H"
          includeMargin={false}
          imageSettings={imageSettings}
        />
      </div>
    </div>
  )
}
