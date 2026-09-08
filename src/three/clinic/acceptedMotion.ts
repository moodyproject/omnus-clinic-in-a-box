import * as THREE from 'three'

/** Seek owned authored clips, never accumulate wall-clock time or overlays. */
export function createAcceptedMotion(root: THREE.Group) {
  const entries = root.children.filter((child) => child.animations.length > 0).map((child) => {
    const mixer = new THREE.AnimationMixer(child)
    const actions = child.animations.map((clip) => {
      const action = mixer.clipAction(clip)
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
