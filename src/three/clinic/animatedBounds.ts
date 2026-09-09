import * as THREE from 'three'

/** Conservative linear-blend skin bounds, shared by the clothes of each rig.
 * A vertex is a nonnegative weighted sum of bone-transformed bind positions.
 * The union of those influence boxes contains the convex combination; the
 * weight-sum interval below also covers quantized weights that do not sum to 1.
 * No pose sampling, bind-pose assumptions, vertex scans or allocations per frame.
 * Unsupported morph/weight data fails OPEN (unculled), never hides an actor.
 */
export function installAnimatedBounds(root: THREE.Group) {
  const groups = new Map<THREE.Skeleton, {
    meshes: THREE.SkinnedMesh[]
    boxes: Map<number, THREE.Box3>
    minSum: number
    maxSum: number
    valid: boolean
  }>()
  const point = new THREE.Vector3(), transform = new THREE.Matrix4()
  root.traverse(node => {
    if (!(node instanceof THREE.SkinnedMesh)) return
    node.frustumCulled = false
    const skeleton = node.skeleton
    let group = groups.get(skeleton)
    if (!group) {
      group = { meshes: [], boxes: new Map(), minSum: Infinity, maxSum: 0, valid: true }
      groups.set(skeleton, group)
    }
    group.meshes.push(node)
    const { position, skinIndex, skinWeight } = node.geometry.attributes
    if (!position || !skinIndex || !skinWeight || node.geometry.morphAttributes.position?.length) {
      group.valid = false
      return
    }
    for (let i = 0; i < position.count; i++) {
      let sum = 0
      for (let k = 0; k < 4; k++) {
        const weight = skinWeight.getComponent(i, k), index = skinIndex.getComponent(i, k)
        if (!Number.isFinite(weight) || weight < 0) { group.valid = false; continue }
        sum += weight
        if (weight === 0) continue
        if (!Number.isInteger(index) || !skeleton.bones[index] || !skeleton.boneInverses[index]) { group.valid = false; continue }
        let box = group.boxes.get(index)
        if (!box) { box = new THREE.Box3(); group.boxes.set(index, box) }
        transform.multiplyMatrices(skeleton.boneInverses[index], node.bindMatrix)
        point.fromBufferAttribute(position, i).applyMatrix4(transform)
        if (![point.x, point.y, point.z].every(Number.isFinite)) group.valid = false
        box.expandByPoint(point)
      }
      group.minSum = Math.min(group.minSum, sum)
      group.maxSum = Math.max(group.maxSum, sum)
    }
  })
  const active = [...groups.entries()].filter(([, group]) => group.valid && group.boxes.size > 0)
  for (const [, group] of active) for (const mesh of group.meshes) {
    mesh.boundingBox = new THREE.Box3()
    mesh.boundingSphere = new THREE.Sphere()
    mesh.frustumCulled = true
  }
  const union = new THREE.Box3(), box = new THREE.Box3(), worldBox = new THREE.Box3(), sphere = new THREE.Sphere()
  const axes = [['x', 12], ['y', 13], ['z', 14]] as const
  const original = root.updateMatrixWorld
  root.updateMatrixWorld = function (force?: boolean) {
    // Renderer traverses the entire rig first, including bones and attached
    // bindMatrixInverse. onBeforeRender would be TOO LATE (already culled).
    original.call(this, force)
    for (const [skeleton, group] of active) {
      union.makeEmpty()
      for (const [index, influence] of group.boxes) {
        union.union(box.copy(influence).applyMatrix4(skeleton.bones[index].matrixWorld))
      }
      // Scale the hull by every possible weight sum, including zero weights.
      for (const [axis] of axes) {
        const lo = union.min[axis], hi = union.max[axis]
        union.min[axis] = Math.min(lo * group.minSum, lo * group.maxSum)
        union.max[axis] = Math.max(hi * group.minSum, hi * group.maxSum)
      }
      // Float32 GPU bone matrices / shader arithmetic versus JS doubles.
      union.expandByScalar(1e-5 + Math.max(union.min.length(), union.max.length()) * 1e-5)
      for (const mesh of group.meshes) {
        const local = mesh.boundingBox!, bound = mesh.boundingSphere!
        local.copy(union).applyMatrix4(mesh.bindMatrixInverse)
        // The GPU weighted vec4 carries w=sum, whereas getVertexPosition's
        // final affine transform uses w=1. Enclose BOTH for quantized/zero sums.
        for (const [axis, index] of axes) {
          const t = mesh.bindMatrixInverse.elements[index]
          local.min[axis] += Math.min(0, t * (group.minSum - 1), t * (group.maxSum - 1))
          local.max[axis] += Math.max(0, t * (group.minSum - 1), t * (group.maxSum - 1))
        }
        local.getBoundingSphere(bound)
        // Native Frustum transforms spheres using max column scale. Ensure
        // its WORLD sphere remains conservative even under a sheared parent.
        worldBox.copy(local).applyMatrix4(mesh.matrixWorld).getBoundingSphere(sphere)
        const scale = mesh.matrixWorld.getMaxScaleOnAxis()
        bound.radius = scale > 0 ? Math.max(bound.radius, sphere.radius / scale) : Infinity
      }
    }
  }
  root.updateMatrixWorld(true)
}
