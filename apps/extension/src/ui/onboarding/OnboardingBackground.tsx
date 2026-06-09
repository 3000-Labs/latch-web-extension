import logoUrl from 'url:../../../assets/brand/latch-logo.svg'
import bkLight1Url from 'url:../../../assets/onboarding/web/bk-light-1.svg'
import bkLight2Url from 'url:../../../assets/onboarding/web/bk-light-2.svg'
import ellipse1Url from 'url:../../../assets/onboarding/web/ellipse-1.svg'
import ellipse2Url from 'url:../../../assets/onboarding/web/ellipse-2.svg'
import ellipse3Url from 'url:../../../assets/onboarding/web/ellipse-3.svg'
import ellipse4Url from 'url:../../../assets/onboarding/web/ellipse-4.svg'
import ellipse5Url from 'url:../../../assets/onboarding/web/ellipse-5.svg'

/** Figma frame `Web Onboarding` (4972:124431) — 1448×918 */
const DESIGN_W = 1448
const DESIGN_H = 918
const GROUP_OFFSET = { x: -351.006, y: -580.907 }

function framePos(groupX: number, groupY: number) {
  return {
    left: `${((GROUP_OFFSET.x + groupX) / DESIGN_W) * 100}%`,
    top: `${((GROUP_OFFSET.y + groupY) / DESIGN_H) * 100}%`,
  }
}

function frameWidth(w: number) {
  return `${(w / DESIGN_W) * 100}%`
}

function frameHeight(h: number) {
  return `${(h / DESIGN_H) * 100}%`
}

function GlowEllipse({
  src,
  left,
  top,
  width,
  height,
  blendMode,
  rotate,
  flipY,
}: {
  src: string
  left: string
  top: string
  width: string
  height: string
  blendMode: 'screen' | 'overlay'
  rotate?: string
  flipY?: boolean
}) {
  return (
    <div
      className="pointer-events-none absolute flex items-center justify-center opacity-[0.27]"
      style={{ left, top, width, height }}
    >
      <div
        className={[
          'relative size-full',
          flipY ? '-scale-y-100' : '',
          rotate ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ mixBlendMode: blendMode }}
      >
        <img alt="" className="block size-full max-w-none" src={src} />
      </div>
    </div>
  )
}

export function OnboardingBackground() {
  const e1 = framePos(270.809, 48)
  const e2 = framePos(742.918, 308)
  const e4 = framePos(617.371, 710.462)
  const e5 = framePos(416.809, 436)
  const ellipseSize = frameWidth(845.124)
  const ellipseHeight = frameHeight(845.124)
  const largeEllipseW = frameWidth(1154.462)
  const largeEllipseH = frameHeight(1154.462)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0">
        {/* Bk Light — upper */}
        <div
          className="absolute flex items-center justify-center opacity-[0.27]"
          style={{
            right: `${(553.17 / DESIGN_W) * 100}%`,
            top: `${(-63.28 / DESIGN_H) * 100}%`,
            bottom: `${(32.01 / DESIGN_H) * 100}%`,
            width: frameWidth(1245.834),
          }}
        >
          <div className="relative size-full rotate-[164.02deg] skew-x-[-1.9deg]">
            <div className="absolute inset-[-47.63%_-42.43%]">
              <img alt="" className="block size-full max-w-none" src={bkLight1Url} />
            </div>
          </div>
        </div>

        <GlowEllipse
          src={ellipse1Url}
          left={e1.left}
          top={e1.top}
          width={ellipseSize}
          height={ellipseHeight}
          blendMode="screen"
        />

        <GlowEllipse
          src={ellipse2Url}
          left={e2.left}
          top={e2.top}
          width={ellipseSize}
          height={ellipseHeight}
          blendMode="overlay"
          rotate="rotate-180"
          flipY
        />

        <GlowEllipse
          src={ellipse3Url}
          left={e2.left}
          top={e2.top}
          width={ellipseSize}
          height={ellipseHeight}
          blendMode="overlay"
          rotate="rotate-180"
          flipY
        />

        <div
          className="pointer-events-none absolute flex items-center justify-center opacity-[0.27]"
          style={{
            left: e4.left,
            top: e4.top,
            width: largeEllipseW,
            height: largeEllipseH,
          }}
        >
          <div className="relative size-full -rotate-[120deg]" style={{ mixBlendMode: 'screen' }}>
            <img alt="" className="block size-full max-w-none" src={ellipse4Url} />
          </div>
        </div>

        <div
          className="pointer-events-none absolute flex items-center justify-center opacity-[0.27]"
          style={{
            left: e4.left,
            top: e4.top,
            width: largeEllipseW,
            height: largeEllipseH,
          }}
        >
          <div className="relative size-full -rotate-[120deg]" style={{ mixBlendMode: 'screen' }}>
            <img alt="" className="block size-full max-w-none" src={ellipse4Url} />
          </div>
        </div>

        <GlowEllipse
          src={ellipse5Url}
          left={e5.left}
          top={e5.top}
          width={ellipseSize}
          height={ellipseHeight}
          blendMode="screen"
        />

        {/* Bk Light — lower */}
        <div
          className="absolute flex items-center justify-center opacity-[0.27]"
          style={{
            right: `${(540.94 / DESIGN_W) * 100}%`,
            top: `${(25.93 / DESIGN_H) * 100}%`,
            bottom: `${(-71.98 / DESIGN_H) * 100}%`,
            width: frameWidth(1346.941),
          }}
        >
          <div className="relative size-full rotate-[-27.79deg] skew-x-[-1.9deg]">
            <div className="absolute inset-[-47.63%_-42.43%]">
              <img alt="" className="block size-full max-w-none" src={bkLight2Url} />
            </div>
          </div>
        </div>
      </div>

      <img
        src={logoUrl}
        alt="Latch"
        className="absolute left-8 top-[48.5px] h-[27px] w-[52px] object-contain object-left"
      />
    </div>
  )
}
