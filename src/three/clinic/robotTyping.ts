import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Measured from the accepted GLB authoring source: display keyboard z + .28.
const STATIONS = [
  ['Reception_Staff', -3.2, 2.66],
  ['Review_Physician', 3.22, -4.54],
  ['Follow_Coordinator', -4.30, -4.50],
] as const

/** Mechanical arm constraints, evaluated only when absolute scroll progress
 * changes. The human rig is never rewritten: shoulders/head keep their clips.
 */
export function createRobotTyping(root: THREE.Group) {
  const arms: { shoulder: THREE.Bone; scene: THREE.Object3D; upper: THREE.Mesh; lower: THREE.Mesh; elbow: THREE.Mesh; hand: THREE.Mesh; x: number; z: number; side: number }[] = []
  const metal = new THREE.MeshStandardMaterial({ color: '#70777f', roughness: .4, metalness: .35 })
  const dark = new THREE.MeshStandardMaterial({ color: '#30343b', roughness: .5, metalness: .25 })
  let created = false
  for (const [id, x, z] of STATIONS) {
    const actor = root.getObjectByName(id)
    if (!actor) continue
    const scene = actor.parent!
    for (const [suffix, side] of [['L', -1], ['R', 1]] as const) {
      let shoulder: THREE.Bone | undefined
      actor.traverse(n => { if (n instanceof THREE.Bone && (n.userData.name ?? n.name) === `upperarm01.${suffix}`) shoulder = n })
      if (!shoulder) continue
      if (actor.userData.typingInstalled) {
        const mesh = (name: string) => actor.getObjectByName(`${id}__robot__${name}.${suffix}`) as THREE.Mesh
        arms.push({ shoulder, scene, upper: mesh('upperarm'), lower: mesh('forearm'), elbow: mesh('elbow'), hand: mesh('wrist'), x: x + side * .10, z: z + .035, side })
        continue
      }
      const part = (name: string, geometry: THREE.BufferGeometry, material: THREE.Material) => {
        created = true
        const mesh = new THREE.Mesh(geometry, material)
        mesh.name = `${id}__robot__${name}.${suffix}`
        mesh.userData.robotPart = true; mesh.userData.brand = 'Omnus'
        mesh.castShadow = true; mesh.receiveShadow = true
        actor.add(mesh); return mesh
      }
      const upper = part('upperarm', new THREE.CylinderGeometry(.055 * .9, .055 * .9, 1, 12), metal)
      const lower = part('forearm', new THREE.CylinderGeometry(.047 * .9, .047 * .9, 1, 12), metal)
      const elbow = part('elbow', new THREE.SphereGeometry(.065 * .9, 10, 8), dark)
      const pieces: THREE.BufferGeometry[] = [new RoundedBoxGeometry(.085, .045, .09, 1, .008)]
      for (const dx of [-.028, 0, .028]) pieces.push(new RoundedBoxGeometry(.019, .025, .065, 1, .006).translate(dx, -.009, -.065))
      const hand = part('wrist', mergeGeometries(pieces)!.scale(.9, .9, .9), metal)
      pieces.forEach(g => g.dispose())
      arms.push({ shoulder, scene, upper, lower, elbow, hand, x: x + side * .10, z: z + .035, side })
    }
    actor.userData.typingInstalled = true
  }
  if (!created) { metal.dispose(); dark.dispose() }
  const shoulder = new THREE.Vector3(), elbow = new THREE.Vector3(), hand = new THREE.Vector3(), delta = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0)
  const shaft = (mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) => {
    delta.subVectors(b, a);mesh.position.copy(a).lerp(b, .5)
    mesh.scale.y = delta.length();mesh.quaternion.setFromUnitVectors(up, delta.normalize())
  }
  return (p: number) => {
    root.updateWorldMatrix(true, true)
    for (const arm of arms) {
      shoulder.setFromMatrixPosition(arm.shoulder.matrixWorld)
      arm.scene.worldToLocal(shoulder)
      // Three-finger hands remain over real key surfaces, with small alternating taps.
      hand.set(arm.x, .841 + .009 * Math.sin(p * 240 + arm.side * 1.6), arm.z)
      elbow.copy(shoulder).lerp(hand, .52);elbow.x += arm.side * .11;elbow.y -= .13
      arm.elbow.position.copy(elbow);arm.hand.position.copy(hand)
      arm.hand.rotation.x = .035 * Math.sin(p * 240 + arm.side)
      shaft(arm.upper, shoulder, elbow);shaft(arm.lower, elbow, hand)
    }
  }
}
