import * as THREE from 'three'

type Angles = readonly [number, number, number]
type Pose = Partial<Record<string, Angles>>
type Beat = { t: number; pose: Pose }
const beat = (t: number, pose: Pose): Beat => ({ t, pose })

// Local-rig rotations, composed with the donor's authored pose. Each role has
// its own task and rhythm, not a mirrored/scaled copy of one arm wave. Feet,
// pelvis, root travel and the complete sixth-person patient clip are untouched.
const checkIn: Pose = {
  spine03: [.12, .12, 0], head: [.18, .18, 0],
  'upperarm01.L': [-.35, 0, -.18], 'lowerarm01.L': [-.48, 0, 0],
  'upperarm01.R': [-.32, 0, .14], 'lowerarm01.R': [-.42, 0, 0],
}
const offer: Pose = {
  spine03: [.06, .18, 0], head: [-.04, .35, 0],
  'upperarm01.L': [-.5, -.15, -.3], 'lowerarm01.L': [-.65, 0, 0], 'wrist.L': [0, -.3, .12],
  'lowerarm01.R': [-.28, 0, 0],
}
const respond: Pose = {
  spine03: [.07, -.15, 0], head: [.12, -.32, 0],
  'upperarm01.R': [-.25, .2, .32], 'lowerarm01.R': [-.8, 0, 0], 'wrist.R': [0, .55, -.16],
}
const examine: Pose = {
  spine03: [.19, -.12, -.03], head: [.12, -.24, 0],
  'upperarm01.L': [-.6, -.12, -.32], 'lowerarm01.L': [-.6, 0, 0], 'wrist.L': [.1, -.22, 0],
  'upperarm01.R': [-.18, 0, .1], 'lowerarm01.R': [-.28, 0, 0],
}
const keyboard: Pose = {
  spine03: [.15, -.12, 0], head: [.22, -.28, 0],
  'upperarm01.L': [-.45, .08, -.22], 'lowerarm01.L': [-.65, 0, 0],
  'upperarm01.R': [-.45, -.08, .22], 'lowerarm01.R': [-.65, 0, 0],
}
const followUp: Pose = {
  spine03: [.07, -.25, 0], head: [-.06, -.42, 0],
  'upperarm01.L': [-.25, -.12, -.32], 'lowerarm01.L': [-1.15, 0, 0], 'wrist.L': [.08, -.2, 0],
  'upperarm01.R': [-.42, 0, .16], 'lowerarm01.R': [-.45, 0, 0],
}
const GESTURES = [
  { id: 'Reception_Staff', start: .28, end: .37, beats: [
    beat(0, {}), beat(.2, checkIn), beat(.32, { ...checkIn, 'wrist.R': [.18, 0, 0] }),
    beat(.43, { ...checkIn, 'wrist.L': [.18, 0, 0] }), beat(.68, offer), beat(.84, offer), beat(1, {}),
  ] },
  { id: 'Reception_Visitor', start: .305, end: .38, beats: [
    beat(0, {}), beat(.18, { head: [.13, -.2, 0] }), beat(.42, respond),
    beat(.57, { ...respond, head: [.3, -.32, 0] }), beat(.7, { ...respond, head: [-.06, -.32, 0] }), beat(1, {}),
  ] },
  { id: 'physician-seated', start: .435, end: .525, beats: [
    beat(0, {}), beat(.2, { spine03: [.1, -.1, 0], head: [.14, -.24, 0] }),
    beat(.45, examine), beat(.66, { ...examine, 'wrist.L': [-.12, .12, 0], head: [.24, -.24, 0] }),
    beat(.82, { ...examine, 'lowerarm01.L': [-.38, 0, 0] }), beat(1, {}),
  ] },
  { id: 'Review_Physician', start: .565, end: .635, beats: [
    beat(0, {}), beat(.2, keyboard),
    ...[.32, .44, .56, .68].map((t, i) => beat(t, {
      ...keyboard, 'wrist.L': [i % 2 ? -.12 : .2, 0, 0], 'wrist.R': [i % 2 ? .2 : -.12, 0, 0],
      'lowerarm01.L': [i % 2 ? -.58 : -.7, 0, 0], 'lowerarm01.R': [i % 2 ? -.7 : -.58, 0, 0],
    })),
    beat(.84, { ...keyboard, head: [-.1, -.32, 0] }), beat(1, {}),
  ] },
  { id: 'Follow_Coordinator', start: .67, end: .745, beats: [
    beat(0, {}), beat(.22, followUp), beat(.45, { ...followUp, head: [.18, -.42, 0] }),
    beat(.58, { ...followUp, head: [-.06, -.42, 0] }),
    beat(.76, { ...followUp, 'upperarm01.R': [-.65, 0, .22], 'wrist.R': [.25, 0, 0] }),
    beat(.88, { ...followUp, 'lowerarm01.L': [-.7, 0, 0] }), beat(1, {}),
  ] },
]

/** Bake owned tracks; the mixer remains the sole bone writer. Sampling from
 * original tracks (never last frame) prevents accumulation and action blending.
 */
function withReadableGestures(child: THREE.Object3D, source: THREE.AnimationClip) {
  const clip = source.clone()
  const q = new THREE.Quaternion(), overlay = new THREE.Quaternion(), next = new THREE.Quaternion(), euler = new THREE.Euler()
  for (const gesture of GESTURES) {
    const actor = child.name === gesture.id ? child : child.getObjectByName(gesture.id)
    if (!actor) continue
    const bones = new Map<string, THREE.Bone>()
    actor.traverse(node => { if (node instanceof THREE.Bone) bones.set(node.userData.name ?? node.name, node) })
    const names = new Set(gesture.beats.flatMap(({ pose }) => Object.keys(pose)))
    for (const name of names) {
      const bone = bones.get(name)
      if (!bone) continue
      const trackName = `${bone.name}.quaternion`
      const original = source.tracks.find(track => track.name === trackName)
      // room-people has one clip per rig. Never insert another rig's channels.
      if (!original) continue
      const interpolant = new THREE.QuaternionLinearInterpolant(original.times, original.values, 4)
      const times: number[] = [], values: number[] = []
      for (let i = 0; i <= 600; i++) {
        const p = i / 600, time = p * source.duration
        const t = THREE.MathUtils.clamp((p - gesture.start) / (gesture.end - gesture.start), 0, 1)
        const index = Math.max(1, gesture.beats.findIndex(b => b.t >= t))
        const a = gesture.beats[index - 1], b = gesture.beats[index]
        const local = (t - a.t) / (b.t - a.t), eased = local * local * (3 - 2 * local)
        overlay.setFromEuler(euler.set(...(a.pose[name] ?? [0, 0, 0])))
        next.setFromEuler(euler.set(...(b.pose[name] ?? [0, 0, 0])))
        overlay.slerp(next, eased)
        q.fromArray(interpolant.evaluate(time)).multiply(overlay).normalize()
        times.push(time); q.toArray(values, values.length)
      }
      clip.tracks = clip.tracks.filter(track => track.name !== trackName)
      clip.tracks.push(new THREE.QuaternionKeyframeTrack(trackName, times, values))
    }
  }
  return clip
}

/** Seek owned authored clips, never accumulate wall-clock time or overlays. */
export function createAcceptedMotion(root: THREE.Group) {
  const entries = root.children.filter((child) => child.animations.length > 0).map((child) => {
    const mixer = new THREE.AnimationMixer(child)
    const actions = child.animations.map((clip) => {
      const action = mixer.clipAction(withReadableGestures(child, clip))
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
      return action
    })
    return { child, mixer, actions }
  })
  let previous = -1
  return {
    update(progress: number) {
      const p = THREE.MathUtils.clamp(progress, 0, 1)
      if (p === previous) return
      previous = p
      for (const { mixer, actions } of entries) {
        for (const action of actions) {
          action.paused = false
          action.time = p * action.getClip().duration
        }
        mixer.update(0)
      }
    },
    dispose() {
      for (const { child, mixer } of entries) {
        mixer.stopAllAction()
        mixer.uncacheRoot(child)
      }
    },
  }
}
