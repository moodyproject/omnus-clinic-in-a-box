import * as THREE from 'three'
import { useEffect, useMemo, useState } from 'react'
import { mulberry32 } from '../lib/rng'

/**
 * all screens, labels, and engravings are drawn on canvases at runtime,
 * so the site ships zero image assets. content is fictional and
 * non-identifying by construction: interfaces are drawn as abstract bars.
 */

const FONT = '"Geist Variable", ui-sans-serif, system-ui, sans-serif'

/** screen ink tones (screens are the only dark surfaces in the clinic) */
const S = {
  bg: '#141619',
  panel: '#1c1f23',
  ink: 'rgba(238, 236, 229, 0.82)',
  dim: 'rgba(238, 236, 229, 0.3)',
  faint: 'rgba(238, 236, 229, 0.12)',
  sage: '#7fa093',
  sageDim: 'rgba(127, 160, 147, 0.4)',
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx }
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export type ScreenKind = 'schedule' | 'visit' | 'draft' | 'kiosk' | 'inbox' | 'status'

export function makeScreenTexture(kind: ScreenKind): THREE.CanvasTexture {
  switch (kind) {
    case 'schedule':
      return drawSchedule()
    case 'visit':
      return drawVisit()
    case 'draft':
      return drawDraft()
    case 'kiosk':
      return drawKiosk()
    case 'inbox':
      return drawInbox()
    case 'status':
      return drawStatus()
  }
}

/** reception monitor: day schedule with calendar blocks */
function drawSchedule(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 320)
  const rand = mulberry32(11)
  ctx.fillStyle = S.bg
  ctx.fillRect(0, 0, 512, 320)

  ctx.fillStyle = S.dim
  ctx.font = `500 17px ${FONT}`
  ctx.fillText('today', 28, 40)
  ctx.fillStyle = S.sage
  ctx.beginPath()
  ctx.arc(490 - 8, 34, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = S.faint
  ctx.beginPath()
  ctx.moveTo(28, 56)
  ctx.lineTo(484, 56)
  ctx.stroke()

  // time rail + appointment blocks
  for (let i = 0; i < 6; i++) {
    const y = 80 + i * 38
    ctx.fillStyle = S.faint
    ctx.fillRect(28, y + 6, 34, 3)
    const w = 160 + rand() * 190
    ctx.fillStyle = i === 1 ? S.sageDim : S.panel
    rr(ctx, 78, y - 8, w, 26, 6)
    ctx.fill()
    if (i === 1) {
      ctx.fillStyle = S.sage
      ctx.fillRect(78, y - 8, 3, 26)
    }
    ctx.fillStyle = S.dim
    ctx.fillRect(90, y + 2, 60 + rand() * 60, 4)
  }
  return toTexture(canvas)
}

/**
 * exam wall display, staged: the interface fills in as the visit progresses.
 * stage 0: live video only. stage 1: transcript rows arrive. stage 2:
 * structured extraction chips complete. drawn as three textures that the
 * exam room crossfades under scroll control.
 */
export function makeVisitStageTexture(stage: 0 | 1 | 2): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(640, 360)
  const rand = mulberry32(23)
  ctx.fillStyle = S.bg
  ctx.fillRect(0, 0, 640, 360)

  // video tile with live dot (all stages)
  ctx.fillStyle = S.panel
  rr(ctx, 26, 26, 250, 156, 10)
  ctx.fill()
  ctx.fillStyle = S.sage
  ctx.beginPath()
  ctx.arc(44, 44, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = S.dim
  ctx.font = `500 13px ${FONT}`
  ctx.fillText('live visit', 56, 48)

  // waveform strip: quiet at stage 0, active afterwards
  for (let i = 0; i < 42; i++) {
    const active = stage > 0 ? 1 : 0.25
    const h = (3 + Math.abs(Math.sin(i * 0.55)) * 14 * (0.4 + rand() * 0.6)) * active
    ctx.fillStyle = stage > 0 ? S.sage : S.faint
    ctx.fillRect(28 + i * 6, 214 - h / 2, 3, h)
  }
  ctx.fillStyle = S.dim
  ctx.font = `500 12px ${FONT}`
  ctx.fillText(stage > 0 ? 'transcribing' : 'listening', 28, 246)

  // transcript column: empty rules at stage 0, rows fill at stage 1+
  for (let i = 0; i < 9; i++) {
    const y = 32 + i * 24
    const w = 120 + rand() * 190
    if (stage === 0) {
      ctx.fillStyle = S.faint
      rr(ctx, 306, y, 300, 1.5, 1)
      ctx.fill()
    } else {
      ctx.fillStyle = i % 3 === 0 ? S.dim : S.faint
      rr(ctx, 306, y, w, 9, 4)
      ctx.fill()
    }
  }

  // extraction chips: outlined at stages 0-1, filled at stage 2
  const chips = ['symptoms', 'medications', 'history', 'assessment', 'plan', 'follow-up']
  ctx.font = `500 13px ${FONT}`
  chips.forEach((label, i) => {
    const x = 26 + (i % 3) * 200
    const y = 272 + Math.floor(i / 3) * 42
    if (stage === 2) {
      ctx.fillStyle = S.panel
      rr(ctx, x, y, 184, 32, 7)
      ctx.fill()
      ctx.fillStyle = S.sage
      ctx.fillRect(x, y, 3, 32)
      ctx.fillStyle = S.ink
      ctx.fillText(label, x + 14, y + 21)
    } else {
      ctx.strokeStyle = S.faint
      rr(ctx, x, y, 184, 32, 7)
      ctx.stroke()
      ctx.fillStyle = S.faint
      ctx.fillText(label, x + 14, y + 21)
    }
  })
  return toTexture(canvas)
}

/** exam wall display: live visit with transcript and extraction chips */
function drawVisit(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(640, 360)
  const rand = mulberry32(23)
  ctx.fillStyle = S.bg
  ctx.fillRect(0, 0, 640, 360)

  // video tile
  ctx.fillStyle = S.panel
  rr(ctx, 26, 26, 250, 156, 10)
  ctx.fill()
  const grad = ctx.createLinearGradient(26, 26, 276, 182)
  grad.addColorStop(0, 'rgba(238,236,229,0.05)')
  grad.addColorStop(1, 'rgba(238,236,229,0.0)')
  ctx.fillStyle = grad
  rr(ctx, 26, 26, 250, 156, 10)
  ctx.fill()
  ctx.fillStyle = S.sage
  ctx.beginPath()
  ctx.arc(44, 44, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = S.dim
  ctx.font = `500 13px ${FONT}`
  ctx.fillText('live visit', 56, 48)

  // waveform strip under the tile
  ctx.fillStyle = S.sage
  for (let i = 0; i < 42; i++) {
    const h = 3 + Math.abs(Math.sin(i * 0.55)) * 14 * (0.4 + rand() * 0.6)
    ctx.fillRect(28 + i * 6, 214 - h / 2, 3, h)
  }
  ctx.fillStyle = S.dim
  ctx.font = `500 12px ${FONT}`
  ctx.fillText('transcribing', 28, 246)

  // transcript column
  for (let i = 0; i < 9; i++) {
    const y = 32 + i * 24
    const w = 120 + rand() * 190
    ctx.fillStyle = i % 3 === 0 ? S.dim : S.faint
    rr(ctx, 306, y, w, 9, 4)
    ctx.fill()
  }

  // extraction chips
  const chips = ['symptoms', 'medications', 'history', 'assessment', 'plan', 'follow-up']
  ctx.font = `500 13px ${FONT}`
  chips.forEach((label, i) => {
    const x = 26 + (i % 3) * 200
    const y = 272 + Math.floor(i / 3) * 42
    ctx.fillStyle = S.panel
    rr(ctx, x, y, 184, 32, 7)
    ctx.fill()
    ctx.fillStyle = S.sage
    ctx.fillRect(x, y, 3, 32)
    ctx.fillStyle = S.ink
    ctx.fillText(label, x + 14, y + 21)
  })
  return toTexture(canvas)
}

/** review monitor: structured draft awaiting the physician */
function drawDraft(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 360)
  const rand = mulberry32(37)
  ctx.fillStyle = S.bg
  ctx.fillRect(0, 0, 512, 360)

  ctx.fillStyle = S.dim
  ctx.font = `500 15px ${FONT}`
  ctx.fillText('visit draft', 28, 38)
  ctx.fillStyle = S.panel
  rr(ctx, 396, 22, 88, 24, 12)
  ctx.fill()
  ctx.fillStyle = S.sage
  ctx.font = `500 12px ${FONT}`
  ctx.fillText('draft', 424, 38)

  const sections = ['subjective', 'objective', 'assessment', 'plan']
  sections.forEach((label, i) => {
    const y = 66 + i * 62
    ctx.fillStyle = S.sageDim
    ctx.fillRect(28, y, 3, 44)
    ctx.fillStyle = S.dim
    ctx.font = `500 12px ${FONT}`
    ctx.fillText(label, 42, y + 10)
    for (let l = 0; l < 2; l++) {
      ctx.fillStyle = S.faint
      rr(ctx, 42, y + 20 + l * 13, 180 + rand() * 240, 7, 3)
      ctx.fill()
    }
  })
  ctx.strokeStyle = S.faint
  ctx.beginPath()
  ctx.moveTo(28, 322)
  ctx.lineTo(484, 322)
  ctx.stroke()
  ctx.fillStyle = S.dim
  ctx.font = `500 13px ${FONT}`
  ctx.fillText('awaiting physician review', 28, 346)
  return toTexture(canvas)
}

/** small self check-in kiosk */
function drawKiosk(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 320)
  ctx.fillStyle = S.bg
  ctx.fillRect(0, 0, 256, 320)
  ctx.fillStyle = S.dim
  ctx.font = `500 15px ${FONT}`
  ctx.fillText('check in', 24, 42)
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = S.panel
    rr(ctx, 24, 66 + i * 46, 208, 32, 7)
    ctx.fill()
    ctx.fillStyle = S.faint
    ctx.fillRect(38, 80 + i * 46, 90 + i * 16, 5)
  }
  ctx.fillStyle = S.sageDim
  rr(ctx, 24, 258, 208, 36, 8)
  ctx.fill()
  return toTexture(canvas)
}

/**
 * ops inbox, staged: stage 0 is a loaded queue (six items, three urgent),
 * stage 1 is the same inbox worked down to a calm state. crossfaded by the
 * ops scene under scroll control.
 */
export function makeInboxStageTexture(stage: 0 | 1): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 320)
  const rand = mulberry32(53)
  ctx.fillStyle = S.bg
  ctx.fillRect(0, 0, 512, 320)
  ctx.fillStyle = S.dim
  ctx.font = `500 15px ${FONT}`
  ctx.fillText('clinic inbox', 28, 40)
  const rows = stage === 0 ? 6 : 2
  for (let i = 0; i < 6; i++) {
    const y = 66 + i * 40
    const w1 = 80 + rand() * 70
    const w2 = 120 + rand() * 120
    if (i >= rows) {
      // resolved row: a thin settled rule with a small check
      ctx.strokeStyle = S.faint
      ctx.beginPath()
      ctx.moveTo(28, y + 15)
      ctx.lineTo(484, y + 15)
      ctx.stroke()
      ctx.strokeStyle = S.sageDim
      ctx.beginPath()
      ctx.moveTo(40, y + 15)
      ctx.lineTo(45, y + 20)
      ctx.lineTo(54, y + 8)
      ctx.stroke()
      continue
    }
    ctx.fillStyle = S.panel
    rr(ctx, 28, y, 456, 30, 6)
    ctx.fill()
    if (stage === 0 && i < 3) {
      ctx.fillStyle = S.sage
      ctx.beginPath()
      ctx.arc(46, y + 15, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = S.dim
    ctx.fillRect(62, y + 12, w1, 5)
    ctx.fillStyle = S.faint
    ctx.fillRect(200, y + 12, w2, 5)
  }
  if (stage === 1) {
    ctx.fillStyle = S.sage
    ctx.font = `500 13px ${FONT}`
    ctx.fillText('queue clear by end of day', 28, 302)
  }
  return toTexture(canvas)
}

/** ops nook: shared inbox queue */
function drawInbox(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 320)
  const rand = mulberry32(53)
  ctx.fillStyle = S.bg
  ctx.fillRect(0, 0, 512, 320)
  ctx.fillStyle = S.dim
  ctx.font = `500 15px ${FONT}`
  ctx.fillText('clinic inbox', 28, 40)
  for (let i = 0; i < 6; i++) {
    const y = 66 + i * 40
    ctx.fillStyle = S.panel
    rr(ctx, 28, y, 456, 30, 6)
    ctx.fill()
    if (i < 3) {
      ctx.fillStyle = S.sage
      ctx.beginPath()
      ctx.arc(46, y + 15, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = S.dim
    ctx.fillRect(62, y + 12, 80 + rand() * 70, 5)
    ctx.fillStyle = S.faint
    ctx.fillRect(200, y + 12, 120 + rand() * 120, 5)
  }
  return toTexture(canvas)
}

/** the appliance's small front status display */
function drawStatus(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 128)
  ctx.fillStyle = '#0b0c0e'
  ctx.fillRect(0, 0, 512, 128)
  ctx.fillStyle = 'rgba(240, 238, 231, 0.82)'
  ctx.font = `500 38px ${FONT}`
  ctx.textBaseline = 'middle'
  ctx.fillText('omnus os', 44, 64)
  ctx.fillStyle = S.sage
  ctx.beginPath()
  ctx.arc(330, 64, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(240, 238, 231, 0.52)'
  ctx.font = `500 27px ${FONT}`
  ctx.fillText('ready', 354, 65)
  return toTexture(canvas)
}

/** transparent label, used for floor zone names and extraction tags */
export function makeLabelTexture(
  text: string,
  opts: { color?: string; size?: number; tracking?: number } = {},
): THREE.CanvasTexture {
  const size = opts.size ?? 44
  const color = opts.color ?? 'rgba(17, 19, 21, 0.55)'
  const { canvas, ctx } = makeCanvas(512, 128)
  ctx.clearRect(0, 0, 512, 128)
  ctx.fillStyle = color
  ctx.font = `500 ${size}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (opts.tracking) {
    ctx.letterSpacing = `${opts.tracking}px`
  }
  ctx.fillText(text, 256, 66)
  const tex = toTexture(canvas)
  return tex
}

/** small tiling terrazzo speckle for the corridor floor */
export function makeTerrazzoTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256)
  const rand = mulberry32(71)
  ctx.fillStyle = '#efece4'
  ctx.fillRect(0, 0, 256, 256)
  const chips = ['#d8d2c4', '#c5beac', '#b0a897', '#e2ddd1', '#9e978a', '#cabfa6']
  for (let i = 0; i < 340; i++) {
    const x = rand() * 256
    const y = rand() * 256
    const r = 0.6 + rand() * 2.1
    ctx.fillStyle = chips[Math.floor(rand() * chips.length)]
    ctx.globalAlpha = 0.35 + rand() * 0.4
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * (0.6 + rand() * 0.7), rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  return toTexture(canvas)
}

/** subtle woven texture for the waiting-area rug */
export function makeWeaveTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128, 128)
  ctx.fillStyle = '#cfc2a8'
  ctx.fillRect(0, 0, 128, 128)
  for (let y = 0; y < 128; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(17,19,21,0.07)' : 'rgba(251,250,247,0.06)'
    ctx.fillRect(0, y, 128, 2)
  }
  for (let x = 0; x < 128; x += 6) {
    ctx.fillStyle = 'rgba(17,19,21,0.045)'
    ctx.fillRect(x, 0, 2, 128)
  }
  return toTexture(canvas)
}

/**
 * inverse vignette laid over each room floor: transparent center, softly
 * darker edges and corners. cheap ambient occlusion that grounds the walls
 * without any postprocessing.
 */
export function makeFloorAOTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256)
  ctx.clearRect(0, 0, 256, 256)
  const edge = 46
  const grad = (x0: number, y0: number, x1: number, y1: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, 'rgba(64, 58, 46, 0.34)')
    g.addColorStop(1, 'rgba(64, 58, 46, 0)')
    return g
  }
  ctx.fillStyle = grad(0, 0, edge, 0)
  ctx.fillRect(0, 0, edge, 256)
  ctx.fillStyle = grad(256, 0, 256 - edge, 0)
  ctx.fillRect(256 - edge, 0, edge, 256)
  ctx.fillStyle = grad(0, 0, 0, edge)
  ctx.fillRect(0, 0, 256, edge)
  ctx.fillStyle = grad(0, 256, 0, 256 - edge)
  ctx.fillRect(0, 256 - edge, 256, edge)
  return toTexture(canvas)
}

/** small framed prints: quiet abstract compositions in the site palette */
export function makeArtTexture(variant: 0 | 1 | 2): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128, 160)
  ctx.fillStyle = '#f6f3ec'
  ctx.fillRect(0, 0, 128, 160)
  if (variant === 0) {
    // sage field over a sand horizon
    ctx.fillStyle = 'rgba(111, 143, 131, 0.55)'
    ctx.beginPath()
    ctx.arc(64, 66, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(179, 162, 132, 0.5)'
    ctx.fillRect(22, 112, 84, 10)
  } else if (variant === 1) {
    // two tall grasses
    ctx.strokeStyle = 'rgba(95, 122, 99, 0.6)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(50, 132)
    ctx.quadraticCurveTo(44, 70, 60, 34)
    ctx.moveTo(74, 132)
    ctx.quadraticCurveTo(84, 84, 72, 48)
    ctx.stroke()
    ctx.fillStyle = 'rgba(173, 132, 106, 0.45)'
    ctx.beginPath()
    ctx.arc(64, 132, 22, Math.PI, 0)
    ctx.fill()
  } else {
    // quiet line composition
    ctx.strokeStyle = 'rgba(17, 19, 21, 0.35)'
    ctx.lineWidth = 2
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(28, 44 + i * 24)
      ctx.lineTo(100, 40 + i * 24)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(111, 143, 131, 0.5)'
    ctx.fillRect(28, 116, 30, 8)
  }
  return toTexture(canvas)
}

let sharedShadow: THREE.CanvasTexture | null = null

/** shared soft shadow blob for furniture feet: cheap ambient occlusion */
export function getSharedShadowTexture(): THREE.CanvasTexture {
  if (!sharedShadow) sharedShadow = makeContactShadowTexture()
  return sharedShadow
}

/** soft radial contact shadow blob, cheaper and steadier than a depth pass */
export function makeContactShadowTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256)
  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 126)
  grad.addColorStop(0, 'rgba(17, 19, 21, 0.5)')
  grad.addColorStop(0.45, 'rgba(17, 19, 21, 0.28)')
  grad.addColorStop(1, 'rgba(17, 19, 21, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)
  return toTexture(canvas)
}

/** subtle machined lettering on the enclosure */
export function makeEngravingTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 160)
  ctx.clearRect(0, 0, 512, 160)
  ctx.font = `560 92px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // shadowed inset lettering: darker fill with a faint top light edge
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillText('omnus', 256, 84)
  ctx.fillStyle = 'rgba(251, 250, 247, 0.08)'
  ctx.fillText('omnus', 256, 87)
  return toTexture(canvas)
}

/** screen texture bound to font readiness, disposed on unmount */
export function useScreenTexture(kind: ScreenKind): THREE.CanvasTexture {
  const fontsReady = useFontsReady()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const texture = useMemo(() => makeScreenTexture(kind), [kind, fontsReady])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

/** re-render canvas textures once the variable font has actually loaded */
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(() => document.fonts.status === 'loaded')
  useEffect(() => {
    let mounted = true
    document.fonts.ready.then(() => {
      if (mounted) setReady(true)
    })
    return () => {
      mounted = false
    }
  }, [])
  return ready
}
