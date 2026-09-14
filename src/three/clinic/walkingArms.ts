import * as THREE from 'three'
type WalkingArms = { restore: () => void; update: (p: number) => void }
const controllers = new WeakMap<THREE.Object3D, WalkingArms>()

/** Relax the seated-bind elbows during travel, retaining the authored opposing
 * shoulder swing. Restore before each mixer sample to avoid cached-track drift. */
export function createWalkingArms(actor: THREE.Object3D) {
  const existing = controllers.get(actor)
  if (existing) return existing
  const bones = new Map<string, THREE.Bone>()
  actor.traverse(node => { if (node instanceof THREE.Bone) bones.set(node.userData.name ?? node.name, node) })
  const arms = ['L', 'R'].map(side => ({
    shoulder: bones.get(`upperarm01.${side}`)!, elbow: bones.get(`lowerarm01.${side}`)!, wrist: bones.get(`wrist.${side}`)!,
    middle: bones.get(`finger3-1.${side}`)!, wristOriginal: new THREE.Quaternion(),
    original: new THREE.Quaternion(),
  }))
  const windows = [[.365, .435], [.545, .615], [.66, .710]]
  const shoulder = new THREE.Vector3(), elbow = new THREE.Vector3(), forearm = new THREE.Vector3(), target = new THREE.Vector3()
  const correction = new THREE.Quaternion(), world = new THREE.Quaternion(), parent = new THREE.Quaternion()
  let applied = false
  const controller: WalkingArms = {
    restore() {
      if (!applied) return
      for (const arm of arms) { arm.elbow.quaternion.copy(arm.original);arm.wrist.quaternion.copy(arm.wristOriginal) }
      applied = false
    },
    update(p: number) {
      const weight = Math.max(...windows.map(([start, end]) => THREE.MathUtils.smoothstep(p, start, start + .006) * (1 - THREE.MathUtils.smoothstep(p, end - .006, end))))
      if (weight === 0) return
      actor.updateWorldMatrix(true, true)
      for (const arm of arms) {
        arm.original.copy(arm.elbow.quaternion)
        arm.wristOriginal.copy(arm.wrist.quaternion)
        arm.shoulder.getWorldPosition(shoulder);arm.elbow.getWorldPosition(elbow);arm.wrist.getWorldPosition(forearm)
        forearm.sub(elbow).normalize()
        target.copy(elbow).sub(shoulder).normalize().addScaledVector(forearm, .12).normalize()
        correction.setFromUnitVectors(forearm, target)
        arm.elbow.getWorldQuaternion(world);arm.elbow.parent!.getWorldQuaternion(parent).invert()
        parent.multiply(correction).multiply(world)
        arm.elbow.quaternion.copy(arm.original).slerp(parent, weight)
        arm.elbow.updateWorldMatrix(false, true)
        arm.wrist.getWorldPosition(shoulder);arm.middle.getWorldPosition(forearm)
        forearm.sub(shoulder).normalize()
        target.copy(shoulder).sub(elbow).normalize().addScaledVector(forearm, .12).normalize()
        correction.setFromUnitVectors(forearm, target)
        arm.wrist.getWorldQuaternion(world);arm.wrist.parent!.getWorldQuaternion(parent).invert()
        parent.multiply(correction).multiply(world)
        arm.wrist.quaternion.copy(arm.wristOriginal).slerp(parent, weight)
        arm.wrist.updateWorldMatrix(false, true)
      }
      applied = true
    },
  }
  controllers.set(actor, controller)
  return controller
}
