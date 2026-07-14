import * as THREE from 'three'

export interface CamKey {
  p: number
  pos: [number, number, number]
  look: [number, number, number]
  fov: number
}

/**
 * the desktop camera journey. one continuous path: studio three-quarter view,
 * approach the seam, glide in over the miniature clinic like a camera above
 * an architectural model, drop low for the exam room (the current product),
 * rise to the overhead cutaway, exit through the open top, and settle back
 * on the closed product.
 */
export const KEYS_DESKTOP: CamKey[] = [
  { p: 0.0, pos: [3.0, 1.5, 3.85], look: [-0.72, 0.82, 0], fov: 35 },
  { p: 0.06, pos: [2.6, 1.38, 3.45], look: [-0.6, 0.84, 0], fov: 35 },
  { p: 0.12, pos: [1.3, 1.15, 2.6], look: [-0.15, 0.9, 0.2], fov: 38 },
  { p: 0.18, pos: [0.35, 1.05, 1.8], look: [0, 0.75, 0.5], fov: 43 },
  { p: 0.235, pos: [0.05, 0.98, 1.2], look: [0, 0.25, 0.2], fov: 47 },
  // reception: leaning over the model from the corridor side
  { p: 0.28, pos: [0.16, 0.95, 0.75], look: [-0.32, 0.1, 0.3], fov: 49 },
  { p: 0.33, pos: [0.05, 0.9, 0.66], look: [-0.34, 0.1, 0.31], fov: 50 },
  { p: 0.38, pos: [-0.05, 0.85, 0.6], look: [-0.35, 0.11, 0.31], fov: 50 },
  // exam: drift across, then drop closer over the wall corner
  { p: 0.43, pos: [-0.16, 0.95, 0.75], look: [0.34, 0.12, 0.31], fov: 50 },
  { p: 0.48, pos: [-0.02, 0.78, 0.62], look: [0.36, 0.14, 0.31], fov: 51 },
  { p: 0.525, pos: [0.04, 0.6, 0.18], look: [0.42, 0.16, 0.36], fov: 53 },
  // review: rise and pivot to the back-right desk
  { p: 0.57, pos: [0.16, 0.86, 0.2], look: [0.37, 0.08, -0.4], fov: 50 },
  { p: 0.63, pos: [0.24, 0.78, 0.06], look: [0.38, 0.09, -0.44], fov: 50 },
  // follow-through: swing to the back-left room
  { p: 0.675, pos: [-0.12, 0.86, 0.18], look: [-0.37, 0.08, -0.4], fov: 50 },
  { p: 0.74, pos: [-0.22, 0.78, 0.06], look: [-0.38, 0.09, -0.44], fov: 50 },
  // operations: rise to the overhead cutaway
  { p: 0.79, pos: [0.04, 1.32, -0.1], look: [0, 0.13, -0.04], fov: 50 },
  { p: 0.85, pos: [0.0, 1.84, 0.02], look: [0, 0.12, -0.03], fov: 48 },
  // reveal: exit through the lifted cap, pull back, the panels close
  { p: 0.885, pos: [0.25, 2.8, 0.65], look: [0, 0.5, 0], fov: 44 },
  { p: 0.925, pos: [1.4, 2.2, 2.2], look: [-0.15, 0.85, 0], fov: 39 },
  { p: 0.965, pos: [2.3, 1.5, 3.15], look: [-0.5, 0.86, 0], fov: 36 },
  { p: 1.0, pos: [2.85, 1.42, 3.7], look: [-0.66, 0.84, 0], fov: 35 },
]

/**
 * mobile path: same structure, pulled back with a wider field of view, and
 * frontal enough that the subject sits in the upper two thirds of the frame
 * above the bottom-anchored copy.
 */
export const KEYS_MOBILE: CamKey[] = [
  { p: 0.0, pos: [1.35, 1.55, 4.4], look: [0, 1.05, 0], fov: 44 },
  { p: 0.06, pos: [1.1, 1.48, 4.1], look: [0, 1.05, 0], fov: 44 },
  { p: 0.12, pos: [0.6, 1.28, 3.1], look: [0, 1.0, 0.2], fov: 46 },
  { p: 0.18, pos: [0.2, 1.12, 2.1], look: [0, 0.78, 0.5], fov: 50 },
  { p: 0.235, pos: [0.03, 1.05, 1.4], look: [0, 0.25, 0.2], fov: 53 },
  { p: 0.28, pos: [0.18, 1.02, 0.85], look: [-0.32, 0.1, 0.3], fov: 55 },
  { p: 0.33, pos: [0.06, 0.98, 0.74], look: [-0.34, 0.1, 0.31], fov: 56 },
  { p: 0.38, pos: [-0.04, 0.92, 0.66], look: [-0.35, 0.11, 0.31], fov: 56 },
  { p: 0.43, pos: [-0.18, 1.02, 0.85], look: [0.34, 0.12, 0.31], fov: 56 },
  { p: 0.48, pos: [-0.04, 0.85, 0.68], look: [0.36, 0.14, 0.31], fov: 57 },
  { p: 0.525, pos: [0.02, 0.66, 0.2], look: [0.42, 0.16, 0.36], fov: 58 },
  { p: 0.57, pos: [0.16, 0.92, 0.24], look: [0.37, 0.08, -0.4], fov: 55 },
  { p: 0.63, pos: [0.24, 0.84, 0.1], look: [0.38, 0.09, -0.44], fov: 55 },
  { p: 0.675, pos: [-0.12, 0.92, 0.22], look: [-0.37, 0.08, -0.4], fov: 55 },
  { p: 0.74, pos: [-0.22, 0.84, 0.1], look: [-0.38, 0.09, -0.44], fov: 55 },
  { p: 0.79, pos: [0.04, 1.5, -0.08], look: [0, 0.13, -0.04], fov: 54 },
  { p: 0.85, pos: [0.0, 2.1, 0.02], look: [0, 0.12, -0.03], fov: 52 },
  { p: 0.885, pos: [0.22, 2.85, 0.7], look: [0, 0.5, 0], fov: 48 },
  { p: 0.925, pos: [0.95, 2.3, 2.4], look: [0, 0.9, 0], fov: 46 },
  { p: 0.965, pos: [1.2, 1.65, 3.65], look: [0, 1.0, 0], fov: 44 },
  { p: 1.0, pos: [1.35, 1.55, 4.3], look: [0, 1.02, 0], fov: 44 },
]

const smooth = (t: number) => t * t * (3 - 2 * t)

const vA = new THREE.Vector3()
const vB = new THREE.Vector3()

/** sample the keyframed path at progress p, writing pos/look into outs */
export function samplePath(
  keys: CamKey[],
  p: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
): number {
  if (p <= keys[0].p) {
    outPos.fromArray(keys[0].pos)
    outLook.fromArray(keys[0].look)
    return keys[0].fov
  }
  const last = keys[keys.length - 1]
  if (p >= last.p) {
    outPos.fromArray(last.pos)
    outLook.fromArray(last.look)
    return last.fov
  }
  let i = 0
  while (i < keys.length - 2 && keys[i + 1].p < p) i++
  const a = keys[i]
  const b = keys[i + 1]
  const t = smooth((p - a.p) / (b.p - a.p))
  vA.fromArray(a.pos)
  vB.fromArray(b.pos)
  outPos.lerpVectors(vA, vB, t)
  vA.fromArray(a.look)
  vB.fromArray(b.look)
  outLook.lerpVectors(vA, vB, t)
  return a.fov + (b.fov - a.fov) * t
}
