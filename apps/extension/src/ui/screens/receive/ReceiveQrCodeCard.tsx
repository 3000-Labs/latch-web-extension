import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

/** Figma receive QR card frame (5110-228664). */
const CARD_WIDTH = 172
const CARD_HEIGHT = 177
const CARD_PADDING_X = 16
const CARD_PADDING_Y = (CARD_HEIGHT - (CARD_WIDTH - CARD_PADDING_X * 2)) / 2
const QR_SIZE = CARD_WIDTH - CARD_PADDING_X * 2
const LOGO_SIZE = 32

export function ReceiveQrCodeCard({ value, logoUrl }: { value: string; logoUrl?: string | null }) {
  const imageSettings = logoUrl
    ? {
        src: logoUrl,
        x: undefined,
        y: undefined,
        height: LOGO_SIZE,
        width: LOGO_SIZE,
        excavate: true,
      }
    : undefined

  return (
    <div
      className="box-border flex shrink-0 items-center justify-center rounded-[24px] bg-white"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        paddingLeft: CARD_PADDING_X,
        paddingRight: CARD_PADDING_X,
        paddingTop: CARD_PADDING_Y,
        paddingBottom: CARD_PADDING_Y,
      }}
    >
      <QRCodeSVG
        value={value}
        size={QR_SIZE}
        level="H"
        includeMargin={false}
        bgColor="#FFFFFF"
        fgColor="#000000"
        imageSettings={imageSettings}
      />
    </div>
  )
}
