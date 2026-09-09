import * as THREE from 'three'

// Stage-local gestures, in radians. Lower body and the complete patient
// narrative remain authored. These are scroll poses, never an idle clock.
const GESTURES = [
  { id: 'Reception_Staff', start: 0.28, end: 0.37, side: 'L', turn: 0.35, lift: 0.95, lean: 0.09 },
  { id: 'Reception_Visitor', start: 0.305, end: 0.38, side: 'R', turn: -0.32, lift: 0.85, lean: 0.06 },
  { id: 'physician-seated', start: 0.435, end: 0.525, side: 'L', turn: -0.24, lift: 1.0, lean: 0.10 },
  { id: 'Review_Physician', start: 0.565, end: 0.635, side: 'R', turn: -0.60, lift: 0.95, lean: 0.12 },
  { id: 'Follow_Coordinator', start: 0.67, end: 0.745, side: 'L', turn: -0.38, lift: 1.0, lean: 0.08 },
] as const

/** Bake an owned runtime clip so the mixer stays the sole bone writer.
 * Compose against the original clip, not last frame's overlaid pose: repeated
 * seeks, reverse and unchanged holds therefore cannot accumulate gestures.
 */
function withReadableGestures(child: THREE.Object3D, source: THREE.AnimationClip) {
  const clip = source.clone()
  const q = new THREE.Quaternion(), overlay = new THREE.Quaternion(), euler = new THREE.Euler()
  for (const gesture of GESTURES) {
    const actor = child.name === gesture.id ? child : child.getObjectByName(gesture.id)
    if (!actor) continue
    const bones = new Map<string, THREE.Bone>()
    actor.traverse(node => { if (node instanceof THREE.Bone) bones.set(node.userData.name ?? node.name, node) })
    for (const name of ['spine03', 'head', 'neck01', `upperarm01.${gesture.side}`, `lowerarm01.${gesture.side}`, `wrist.${gesture.side}`]) {
      const bone = bones.get(name)
      if (!bone) continue
      const trackName = `${bone.name}.quaternion`
      const original = source.tracks.find(track => track.name === trackName)
      // room-people contains one clip per rig. Never add another rig's
      // channels to that clip, which would blend competing action writers.
      if (!original) continue
      const interpolant = new THREE.QuaternionLinearInterpolant(original.times, original.values, 4)
      const times: number[] = [], values: number[] = []
      for (let i = 0; i <= 600; i++) {
        const p = i / 600, time = p * source.duration
        const t = THREE.MathUtils.clamp((p - gesture.start) / (gesture.end - gesture.start), 0, 1)
        const reach = Math.sin(Math.PI * t) ** 2
        const nod = Math.sin(Math.PI * t * 2) * reach
        euler.set(0, 0, 0)
        if (name === 'spine03') euler.set(gesture.lean * reach, gesture.turn * 0.5 * reach, 0)
        else if (name === 'head') euler.set(0.18 * nod, gesture.turn * reach, 0)
        else if (name === 'neck01') euler.set(0.06 * nod, 0, 0)
        else if (name.startsWith('upperarm')) euler.set(-0.22 * reach, 0, (gesture.side === 'L' ? -1 : 1) * 0.55 * reach)
        else if (name.startsWith('lowerarm')) euler.set(-gesture.lift * reach, 0, 0)
        else euler.set(0, 0.2 * reach, 0.22 * nod)
        q.fromArray(interpolant.evaluate(time))
        q.multiply(overlay.setFromEuler(euler)).normalize()
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
