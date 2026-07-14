import type { SceneId } from '../content/copy'

/** total scroll length of the pinned journey, in viewport heights */
export const JOURNEY_VH_DESKTOP = 820
export const JOURNEY_VH_MOBILE = 700

/**
 * normalized progress windows for each scene of the journey.
 * everything (camera, geometry, dom copy) derives from these.
 */
export const SCENES: Record<SceneId, { a: number; b: number }> = {
  object: { a: 0.0, b: 0.1 },
  enter: { a: 0.1, b: 0.26 },
  before: { a: 0.26, b: 0.38 },
  during: { a: 0.38, b: 0.52 },
  review: { a: 0.52, b: 0.63 },
  after: { a: 0.63, b: 0.74 },
  ops: { a: 0.74, b: 0.85 },
  reveal: { a: 0.85, b: 1.0 },
}

/**
 * single source of truth for scroll progress, written by ScrollTrigger and
 * read by the r3f render loop. mutated, never replaced, so three.js code can
 * hold a stable reference. `snap` asks the camera rig to jump instead of
 * damping (used on load when restoring a mid-page scroll position).
 */
export const journeyState = {
  p: 0,
  snap: true,
}

/**
 * qa pose mode: `?pose=0.45` freezes the journey at a progress value without
 * scrolling, so any scene can be screenshotted deterministically (headless
 * browsers do not capture scrolled viewports). harmless in production.
 */
export const POSE: number | null = (() => {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('pose')
  if (raw === null) return null
  const v = Number.parseFloat(raw)
  return Number.isNaN(v) ? null : Math.min(1, Math.max(0, v))
})()

/** smoothed progress, written once per frame by the camera rig */
export const smoothedState = {
  p: 0,
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** linear 0..1 window between a and b */
export const win = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))

/** smoothstep-eased window */
export const swin = (p: number, a: number, b: number) => {
  const t = win(p, a, b)
  return t * t * (3 - 2 * t)
}

/** progress inside a scene, 0..1 */
export const sceneT = (p: number, id: SceneId) => win(p, SCENES[id].a, SCENES[id].b)

/** shell opening factor: 0 closed, 1 fully open. pure function of progress. */
export const shellOpen = (p: number) => swin(p, 0.115, 0.235) * (1 - swin(p, 0.9, 0.965))

/** top cap lift factor, with extra clearance during the overhead scene */
export const capLift = (p: number) => {
  const base = swin(p, 0.15, 0.27) * (1 - swin(p, 0.88, 0.95))
  const overhead = 0.5 * swin(p, 0.72, 0.79) * (1 - swin(p, 0.86, 0.92))
  return clamp01(base + overhead)
}

/** how deep inside the appliance the camera is: 0 outside, 1 inside */
export const insideFactor = (p: number) => swin(p, 0.19, 0.27) * (1 - swin(p, 0.86, 0.93))
