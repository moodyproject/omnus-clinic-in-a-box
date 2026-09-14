import * as THREE from 'three'
type WalkingArms = { restore: () => void; update: (p: number) => void }
const controllers = new WeakMap<THREE.Object3D, WalkingArms>()

/** Lower the whole seated-bind arm chain and counter-swing from the actual
 * leg pose. Restore before each mixer sample to avoid cached-track drift. */
export function createWalkingArms(actor: THREE.Object3D) {
  const existing = controllers.get(actor)
  if (existing) return existing
  const bones = new Map<string, THREE.Bone>()
  actor.traverse(node => { if (node instanceof THREE.Bone) bones.set(node.userData.name ?? node.name, node) })
  const arms = ['L', 'R'].map(side => ({
    shoulder: bones.get(`upperarm01.${side}`)!, elbow: bones.get(`lowerarm01.${side}`)!, wrist: bones.get(`wrist.${side}`)!,
    middle: bones.get(`finger3-1.${side}`)!, wristOriginal: new THREE.Quaternion(),
    index: bones.get(`finger2-1.${side}`)!, little: bones.get(`finger5-1.${side}`)!,
    hip: bones.get(`upperleg01.${side}`)!, knee: bones.get(`lowerleg01.${side}`)!, shoulderOriginal: new THREE.Quaternion(),
    original: new THREE.Quaternion(),
  }))
  const windows = [[.355, .365, .435, .445], [.539, .545, .615, .623], [.658, .664, .710, .718]]
  const shoulder = new THREE.Vector3(), elbow = new THREE.Vector3(), forearm = new THREE.Vector3(), target = new THREE.Vector3()
  const across = new THREE.Vector3(), forward = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0)
  const handAxis = new THREE.Vector3(), palmNormal = new THREE.Vector3(), inward = new THREE.Vector3()
  const correction = new THREE.Quaternion(), world = new THREE.Quaternion(), parent = new THREE.Quaternion()
  let applied = false
  const controller: WalkingArms = {
    restore() {
      if (!applied) return
      for (const arm of arms) { arm.shoulder.quaternion.copy(arm.shoulderOriginal);arm.elbow.quaternion.copy(arm.original);arm.wrist.quaternion.copy(arm.wristOriginal) }
      applied = false
    },
    update(p: number) {
      const weight = Math.max(...windows.map(([start, settled, release, end]) => THREE.MathUtils.smoothstep(p, start, settled) * (1 - THREE.MathUtils.smoothstep(p, release, end))))
      if (weight === 0) return
      actor.updateWorldMatrix(true, true)
      arms[0].shoulder.getWorldPosition(across);arms[1].shoulder.getWorldPosition(shoulder)
      across.sub(shoulder).setY(0).normalize();forward.crossVectors(up, across).normalize()
      const legs = arms.map(arm => { arm.knee.getWorldPosition(elbow);arm.hip.getWorldPosition(shoulder);return elbow.sub(shoulder).normalize().dot(forward) })
      for (const [index, arm] of arms.entries()) {
        arm.shoulderOriginal.copy(arm.shoulder.quaternion)
        arm.original.copy(arm.elbow.quaternion)
        arm.wristOriginal.copy(arm.wrist.quaternion)
        arm.shoulder.getWorldPosition(shoulder);arm.elbow.getWorldPosition(elbow)
        forearm.copy(elbow).sub(shoulder).normalize()
        // Small lateral clearance, with the arm opposing its same-side leg.
        const swing = (legs[index] - legs[1 - index]) * .5
        target.copy(up).negate().addScaledVector(across, index === 0 ? .10 : -.10).addScaledVector(forward, -.65 * swing).normalize()
        correction.setFromUnitVectors(forearm, target)
        arm.shoulder.getWorldQuaternion(world);arm.shoulder.parent!.getWorldQuaternion(parent).invert()
        parent.multiply(correction).multiply(world)
        arm.shoulder.quaternion.copy(arm.shoulderOriginal).slerp(parent, weight)
        arm.shoulder.updateWorldMatrix(false, true)
        arm.shoulder.getWorldPosition(shoulder);arm.elbow.getWorldPosition(elbow);arm.wrist.getWorldPosition(forearm)
        forearm.sub(elbow).normalize()
        target.copy(elbow).sub(shoulder).normalize().addScaledVector(forward, .13).normalize()
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
        // Twist only at the wrist: retain the approved arm swing and finger
        // direction, while turning each palm toward its corresponding thigh.
        arm.middle.getWorldPosition(handAxis);handAxis.sub(shoulder).normalize()
        arm.little.getWorldPosition(palmNormal);arm.index.getWorldPosition(forearm)
        palmNormal.sub(forearm).multiplyScalar(index === 0 ? 1 : -1).cross(handAxis).normalize()
        inward.copy(across).multiplyScalar(index === 0 ? -1 : 1).addScaledVector(handAxis, -across.dot(handAxis) * (index === 0 ? -1 : 1)).normalize()
        const twist = Math.atan2(forearm.crossVectors(palmNormal, inward).dot(handAxis), palmNormal.dot(inward))
        correction.setFromAxisAngle(handAxis, twist * weight)
        arm.wrist.getWorldQuaternion(world);arm.wrist.parent!.getWorldQuaternion(parent).invert()
        arm.wrist.quaternion.copy(parent).multiply(correction).multiply(world)
        arm.wrist.updateWorldMatrix(false, true)
      }
      applied = true
    },
  }
  controllers.set(actor, controller)
  return controller
}
