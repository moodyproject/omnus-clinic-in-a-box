import * as THREE from 'three'

/** Solve only the holding arms after the authored pose has been sampled.
 * Original bone lengths are retained; the next mixer seek resets every joint. */
export function createChartGrip(actor: THREE.Object3D, bones: Map<string, THREE.Bone>) {
  const arms = (['L', 'R'] as const).map((side, i) => ({
    side: i === 0 ? 1 : -1,
    shoulder: bones.get(`upperarm01.${side}`)!, elbow: bones.get(`lowerarm01.${side}`)!,
    wrist: bones.get(`wrist.${side}`)!, palm: bones.get(`finger3-1.${side}`)!,
    index: bones.get(`finger2-1.${side}`)!, little: bones.get(`finger5-1.${side}`)!,
  }))
  const target = new THREE.Vector3(), offset = new THREE.Vector3(), origin = new THREE.Vector3(), current = new THREE.Vector3(), desired = new THREE.Vector3()
  const world = new THREE.Quaternion(), parent = new THREE.Quaternion(), correction = new THREE.Quaternion(), wristRotation = new THREE.Quaternion()
  const body = actor.getObjectByName('Physician_Body') as THREE.SkinnedMesh
  const handVertices = { L: [] as number[], R: [] as number[] }
  const contactVertices = new Map<number, number[]>()
  const indices = body.geometry.attributes.skinIndex, weights = body.geometry.attributes.skinWeight
  for (let i = 0; i < indices.count; i++) {
    for (let k = 0; k < 4; k++) {
      const bone = body.skeleton.bones[indices.getComponent(i, k)], name = bone.userData.name ?? bone.name
      if (weights.getComponent(i, k) > .15 && /wrist|finger|metacarpal/.test(name)) {
        handVertices[name.endsWith('.L') ? 'L' : 'R'].push(i);break
      }
    }
  }
  const inverse = new THREE.Matrix4(), vertex = new THREE.Vector3(), contact = new THREE.Vector3(), shift = new THREE.Vector3()
  const across = new THREE.Vector3(), forward = new THREE.Vector3(), normal = new THREE.Vector3(), handBasis = new THREE.Matrix4(), handRotation = new THREE.Quaternion()
  const original = new Map([...bones.values()].filter(bone => /^(upperarm01|lowerarm01|wrist|finger)/.test(bone.userData.name ?? bone.name)).map(bone => [bone, bone.quaternion.clone()]))
  let applied = false
  const restore = () => {
    if (!applied) return
    for (const [bone, pose] of original) bone.quaternion.copy(pose)
    applied = false
  }
  const update = (chart: THREE.Object3D) => {
    for (const [bone, pose] of original) pose.copy(bone.quaternion)
    applied = true
    chart.updateWorldMatrix(true, false)
    for (const arm of arms) {
      arm.wrist.getWorldQuaternion(wristRotation)
      arm.index.getWorldPosition(origin);arm.little.getWorldPosition(across);across.sub(origin).multiplyScalar(arm.side).normalize()
      arm.palm.getWorldPosition(forward);arm.wrist.getWorldPosition(origin);forward.sub(origin).addScaledVector(across, -forward.dot(across)).normalize()
      normal.crossVectors(forward, across).normalize();handBasis.makeBasis(across, normal, forward)
      handRotation.setFromRotationMatrix(handBasis).invert()
      chart.getWorldQuaternion(world)
      correction.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -arm.side * .35)
      world.multiply(correction);wristRotation.premultiply(handRotation).premultiply(world)
      arm.wrist.parent!.getWorldQuaternion(parent).invert();arm.wrist.quaternion.copy(parent).multiply(wristRotation);arm.wrist.updateWorldMatrix(false, true)
      // Close the four fingers underneath the rim instead of leaving two
      // open palms beside it. The thumb remains opposed above the fingers.
      const suffix = arm.side === 1 ? 'L' : 'R'
      normal.set(1, 0, 0).transformDirection(chart.matrixWorld)
      for (let finger = 2; finger <= 5; finger++) for (let joint = 1; joint <= 3; joint++) {
        const bone = bones.get(`finger${finger}-${joint}.${suffix}`)!
        correction.setFromAxisAngle(normal, joint === 2 ? .65 : .35)
        bone.getWorldQuaternion(world);bone.parent!.getWorldQuaternion(parent).invert()
        bone.quaternion.copy(parent).multiply(correction).multiply(world);bone.updateWorldMatrix(false, true)
      }
      arm.palm.getWorldPosition(offset);arm.wrist.getWorldPosition(origin);offset.sub(origin)
      if (arm.side === -1) {
        normal.set(0, 0, 1).transformDirection(chart.matrixWorld)
        for (let joint = 1; joint <= 3; joint++) {
          const bone = bones.get(`finger1-${joint}.R`)!
          correction.setFromAxisAngle(normal, joint === 2 ? -.35 : -.15)
          bone.getWorldQuaternion(world);bone.parent!.getWorldQuaternion(parent).invert()
          bone.quaternion.copy(parent).multiply(correction).multiply(world);bone.updateWorldMatrix(false, true)
        }
      }
      target.set(arm.side * .30, -.035, -.07).applyMatrix4(chart.matrixWorld).sub(offset)
      for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < 16; i++) {
        for (const joint of [arm.elbow, arm.shoulder]) {
          joint.getWorldPosition(origin);arm.wrist.getWorldPosition(current)
          current.sub(origin).normalize();desired.copy(target).sub(origin).normalize()
          correction.setFromUnitVectors(current, desired)
          joint.getWorldQuaternion(world);joint.parent!.getWorldQuaternion(parent).invert()
          joint.quaternion.copy(parent).multiply(correction).multiply(world)
          joint.updateWorldMatrix(false, true)
        }
      }
      arm.wrist.parent!.getWorldQuaternion(parent).invert()
      arm.wrist.quaternion.copy(parent).multiply(wristRotation)
      arm.wrist.updateWorldMatrix(false, true)
      if (pass < 3) {
        // Settle the inward skin surface into a rim pinch, with fingers below.
        // Cache a generous extremal set from the fixed grip shape: rescanning
        // the entire skinned hand on every scroll update is unnecessary.
        body.skeleton.update()
        inverse.copy(chart.matrixWorld).invert().multiply(body.matrixWorld)
        contact.set(arm.side * Infinity, 0, 0)
        const cached = contactVertices.get(arm.side)
        const candidates: { id: number; x: number }[] = []
        for (const id of cached ?? handVertices[arm.side === 1 ? 'L' : 'R']) {
          body.getVertexPosition(id, vertex).applyMatrix4(inverse)
          if (!cached) candidates.push({ id, x: vertex.x * arm.side })
          if (vertex.x * arm.side < contact.x * arm.side) contact.copy(vertex)
        }
        if (!cached) contactVertices.set(arm.side, candidates.sort((a, b) => a.x - b.x).slice(0, 64).map(item => item.id))
        shift.set(arm.side * .195, arm.side === 1 ? .022 : .021, THREE.MathUtils.clamp(contact.z, -.12, .12)).sub(contact)
        shift.applyMatrix4(chart.matrixWorld).sub(chart.getWorldPosition(origin))
        target.add(shift)
      }
      }
    }
    actor.updateMatrixWorld(true)
  }
  return Object.assign(update, { restore })
}
