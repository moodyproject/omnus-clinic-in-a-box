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
  { p: 0.0, pos: [2.8, 1.08, 3.5], look: [-0.82, 0.38, 0], fov: 35 },
  { p: 0.06, pos: [2.45, 1.0, 3.15], look: [-0.68, 0.4, 0], fov: 35 },
  { p: 0.12, pos: [1.15, 0.9, 2.35], look: [-0.12, 0.45, 0.15], fov: 38 },
  { p: 0.18, pos: [0.35, 0.92, 1.7], look: [0, 0.42, 0.45], fov: 42 },
  { p: 0.235, pos: [0.05, 0.98, 1.2], look: [0, 0.25, 0.2], fov: 47 },
  // reception: leaning over the model, steep enough to clear the wall caps
  { p: 0.28, pos: [0.14, 1.3, 0.82], look: [-0.28, 0.08, 0.33], fov: 44 },
  { p: 0.33, pos: [0.02, 1.26, 0.74], look: [-0.28, 0.08, 0.33], fov: 44 },
  { p: 0.38, pos: [-0.02, 1.18, 0.7], look: [-0.26, 0.09, 0.33], fov: 45 },
  // exam: hover inside the model over the room's northeast corner, so the
  // physician and patient sit in profile with no wall in the sightline
  { p: 0.43, pos: [0.42, 0.95, 0.74], look: [0.31, 0.12, 0.34], fov: 46 },
  { p: 0.48, pos: [0.46, 0.76, 0.6], look: [0.32, 0.12, 0.35], fov: 47 },
  { p: 0.525, pos: [0.48, 0.65, 0.52], look: [0.33, 0.14, 0.34], fov: 49 },
  // review: rise and pivot to the back-right desk
  { p: 0.57, pos: [0.22, 0.86, 0.26], look: [0.4, 0.08, -0.4], fov: 50 },
  { p: 0.63, pos: [0.28, 0.78, 0.1], look: [0.4, 0.09, -0.44], fov: 50 },
  // follow-through: swing to the back-left room
  { p: 0.675, pos: [-0.18, 0.86, 0.24], look: [-0.4, 0.08, -0.4], fov: 50 },
  { p: 0.74, pos: [-0.26, 0.78, 0.1], look: [-0.4, 0.09, -0.44], fov: 50 },
  // operations: rise to the overhead cutaway, shifted so the west stations
  // clear the editorial copy column
  { p: 0.79, pos: [-0.08, 1.32, -0.1], look: [-0.12, 0.13, -0.04], fov: 50 },
  { p: 0.85, pos: [-0.12, 1.84, 0.02], look: [-0.12, 0.12, -0.03], fov: 48 },
  // reveal: rise past the hovering sleeve, pull back, the sleeve settles
  { p: 0.885, pos: [0.3, 3.05, 0.75], look: [0, 0.4, 0], fov: 44 },
  { p: 0.925, pos: [1.35, 1.75, 2.15], look: [-0.15, 0.45, 0], fov: 39 },
  { p: 0.965, pos: [2.3, 1.18, 3.0], look: [-0.6, 0.4, 0], fov: 36 },
  { p: 1.0, pos: [2.85, 1.1, 3.55], look: [-0.78, 0.38, 0], fov: 35 },
]

/**
 * mobile path: same structure, pulled back with a wider field of view, and
 * frontal enough that the subject sits in the upper two thirds of the frame
 * above the bottom-anchored copy.
 */
export const KEYS_MOBILE: CamKey[] = [
  { p: 0.0, pos: [0.9, 1.02, 3.1], look: [0, 0.08, 0], fov: 43 },
  { p: 0.06, pos: [0.8, 0.98, 2.95], look: [0, 0.12, 0], fov: 44 },
  { p: 0.12, pos: [0.45, 0.95, 2.7], look: [0, 0.3, 0.15], fov: 47 },
  { p: 0.18, pos: [0.15, 0.95, 2.0], look: [0, 0.35, 0.45], fov: 50 },
  { p: 0.235, pos: [0.03, 1.05, 1.4], look: [0, 0.25, 0.2], fov: 53 },
  { p: 0.28, pos: [0.16, 1.38, 0.9], look: [-0.28, 0.08, 0.33], fov: 50 },
  { p: 0.33, pos: [0.04, 1.34, 0.8], look: [-0.28, 0.08, 0.33], fov: 50 },
  { p: 0.38, pos: [-0.02, 1.24, 0.74], look: [-0.26, 0.09, 0.33], fov: 51 },
  { p: 0.43, pos: [0.44, 1.02, 0.8], look: [0.31, 0.12, 0.34], fov: 52 },
  { p: 0.48, pos: [0.48, 0.84, 0.66], look: [0.32, 0.12, 0.35], fov: 54 },
  { p: 0.525, pos: [0.5, 0.71, 0.56], look: [0.33, 0.14, 0.34], fov: 56 },
  { p: 0.57, pos: [0.16, 0.92, 0.24], look: [0.37, 0.08, -0.4], fov: 55 },
  { p: 0.63, pos: [0.24, 0.84, 0.1], look: [0.38, 0.09, -0.44], fov: 55 },
  { p: 0.675, pos: [-0.12, 0.92, 0.22], look: [-0.37, 0.08, -0.4], fov: 55 },
  { p: 0.74, pos: [-0.22, 0.84, 0.1], look: [-0.38, 0.09, -0.44], fov: 55 },
  { p: 0.79, pos: [0.04, 2.0, -0.08], look: [0, 0.13, -0.04], fov: 54 },
  { p: 0.85, pos: [0.0, 2.85, 0.02], look: [0, 0.12, -0.03], fov: 52 },
  { p: 0.885, pos: [0.25, 3.15, 0.8], look: [0, 0.4, 0], fov: 48 },
  { p: 0.925, pos: [0.9, 1.9, 2.5], look: [0, 0.5, 0], fov: 46 },
  { p: 0.965, pos: [0.95, 1.15, 3.25], look: [0, 0.25, 0], fov: 44 },
  { p: 1.0, pos: [0.95, 1.05, 3.5], look: [0, 0.18, 0], fov: 44 },
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
