/**
 * scroll-driven choreography for the miniature cast.
 *
 * a person's journey is a list of segments over normalized progress. every
 * quantity a segment produces (position, facing, clip choice, clip time) is a
 * pure function of progress, so scrubbing backward replays the exact same
 * states in reverse and motion freezes the instant scrolling stops.
 */

export type ClipName = 'Idle' | 'Idle_Neutral' | 'Interact' | 'Walk' | 'Wave'

interface SegBase {
  /** progress window */
  a: number
  b: number
}

/** standing at a spot, playing a quiet loop */
export interface StandSeg extends SegBase {
  kind: 'stand'
  at: [number, number]
  face: number
  clip?: ClipName
  /** optional point to keep the head turned toward */
  look?: [number, number]
}

/** seated at a spot (lower body posed procedurally, upper body from clip) */
export interface SitSeg extends SegBase {
  kind: 'sit'
  at: [number, number]
  face: number
  clip?: ClipName
  look?: [number, number]
}

/** walking a polyline at constant speed */
export interface WalkSeg extends SegBase {
  kind: 'walk'
  path: [number, number][]
  /** yaw to settle into over the last stretch (defaults to path direction) */
  endFace?: number
}

export type Seg = StandSeg | SitSeg | WalkSeg

/** what the rig needs to pose one person for a given progress value */
export interface PersonPose {
  x: number
  z: number
  yaw: number
  /** 0 standing, 1 fully seated */
  sit: number
  /** up to two clips with weights summing to 1 */
  clips: { name: ClipName; time: number; weight: number }[]
  look: [number, number] | null
}

/** seconds of loop-clip time per unit of scroll progress */
const TIME_SCALE = 34
/** world units walked per second of walk-clip time (tuned against stride) */
const WALK_SPEED = 0.115
/** how far into a segment the previous segment's state blends out */
const BLEND_PROGRESS = 0.012

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function segLengths(path: [number, number][]): { total: number; acc: number[] } {
  const acc = [0]
  let total = 0
  for (let i = 1; i < path.length; i++) {
    total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1])
    acc.push(total)
  }
  return { total, acc }
}

const lerpAngle = (a: number, b: number, t: number) => {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

interface SegState {
  x: number
  z: number
  yaw: number
  sit: number
  clip: ClipName
  clipTime: number
  look: [number, number] | null
}

/** evaluate one segment at local time t in [0, 1] */
function evalSeg(seg: Seg, t: number, phase: number, p: number): SegState {
  if (seg.kind === 'walk') {
    const { total, acc } = segLengths(seg.path)
    const dist = clamp01(t) * total
    let i = 1
    while (i < acc.length - 1 && acc[i] < dist) i++
    const span = acc[i] - acc[i - 1] || 1
    const f = (dist - acc[i - 1]) / span
    const ax = seg.path[i - 1][0]
    const az = seg.path[i - 1][1]
    const bx = seg.path[i][0]
    const bz = seg.path[i][1]
    const x = ax + (bx - ax) * f
    const z = az + (bz - az) * f
    let yaw = Math.atan2(bx - ax, bz - az)
    if (seg.endFace !== undefined) {
      // settle into the requested facing over the final stretch
      const settle = clamp01((t - 0.82) / 0.18)
      yaw = lerpAngle(yaw, seg.endFace, settle)
    }
    return { x, z, yaw, sit: 0, clip: 'Walk', clipTime: dist / WALK_SPEED + phase, look: null }
  }

  const clip = seg.clip ?? (seg.kind === 'sit' ? 'Idle_Neutral' : 'Idle')
  return {
    x: seg.at[0],
    z: seg.at[1],
    yaw: seg.face,
    sit: seg.kind === 'sit' ? 1 : 0,
    clip,
    clipTime: (p - seg.a) * TIME_SCALE + phase,
    look: seg.look ?? null,
  }
}

/** evaluate a whole track at progress p */
export function evalTrack(track: Seg[], p: number, phase: number, out: PersonPose): void {
  // find the active segment (before the first / after the last clamps)
  let idx = 0
  while (idx < track.length - 1 && p >= track[idx + 1].a) idx++
  const seg = track[idx]
  const local = seg.b > seg.a ? clamp01((p - seg.a) / (seg.b - seg.a)) : 1

  const cur = evalSeg(seg, local, phase, Math.min(Math.max(p, seg.a), seg.b))

  // blend from the previous segment's final state across the boundary
  let mix = 1
  if (idx > 0 && p - seg.a < BLEND_PROGRESS && p >= seg.a) {
    mix = clamp01((p - seg.a) / BLEND_PROGRESS)
  }

  if (mix < 1) {
    const prev = track[idx - 1]
    const prevState = evalSeg(prev, 1, phase, prev.b)
    out.x = prevState.x + (cur.x - prevState.x) * mix
    out.z = prevState.z + (cur.z - prevState.z) * mix
    out.yaw = lerpAngle(prevState.yaw, cur.yaw, mix)
    out.sit = prevState.sit + (cur.sit - prevState.sit) * mix
    out.look = mix > 0.5 ? cur.look : prevState.look
    if (prevState.clip === cur.clip) {
      out.clips = [{ name: cur.clip, time: cur.clipTime, weight: 1 }]
    } else {
      out.clips = [
        { name: prevState.clip, time: prevState.clipTime, weight: 1 - mix },
        { name: cur.clip, time: cur.clipTime, weight: mix },
      ]
    }
    return
  }

  out.x = cur.x
  out.z = cur.z
  out.yaw = cur.yaw
  out.sit = cur.sit
  out.look = cur.look
  out.clips = [{ name: cur.clip, time: cur.clipTime, weight: 1 }]
}
