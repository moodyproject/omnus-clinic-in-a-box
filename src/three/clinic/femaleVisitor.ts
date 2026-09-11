import * as THREE from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { seatedPatientClip } from './patientActivity'

/** Clone the complete female skin AND its matching skeleton, never bind female
 * vertices to the male visitor's rest skeleton. Retain the visitor's seat/yaw.
 */
export function installFemaleVisitor(scene: THREE.Group, patient: THREE.Object3D) {
  const source = patient
  const original = scene.getObjectByName('Reception_Visitor')
  if (!source || !original || original.userData.patientIdentity) return
  const visitor = clone(source)
  visitor.position.set(0, 0, 0)
  visitor.quaternion.identity()
  visitor.scale.setScalar(1)
  const names = new Map<string, string>()
  visitor.traverse(node => {
    const old = node.name
    node.name = `FemaleVisitor__${old}`
    names.set(old, node.name)
  })
  visitor.name = 'Reception_Visitor'
  const identity = new Map<string, THREE.Material | THREE.Material[]>()
  const key = (node: THREE.Object3D) => node.userData.MPFB_GEN_asset_source ?? node.userData.MPFB_GEN_object_type
  patient.traverse(node => { if (node instanceof THREE.SkinnedMesh) identity.set(key(node), node.material) })
  visitor.traverse(node => {
    if (!(node instanceof THREE.SkinnedMesh)) return
    const material = identity.get(key(node))
    if (!material) throw new Error(`Female visitor: missing patient appearance ${key(node)}`)
    node.material = material
  })
  visitor.userData = { ...source.userData, personId: 'Reception_Visitor', patientIdentity: 'female-patient' }
  const rig = visitor.children[0], originalRig = original.children[0]
  rig.position.x = originalRig.position.x
  rig.position.y = scene.getObjectByName('Reception_Staff')!.children[0].position.y
  rig.position.z = originalRig.position.z
  rig.quaternion.copy(originalRig.quaternion)
  for (const clip of source.animations) {
    if (!clip.tracks.some(track => names.has(track.name.slice(0, track.name.lastIndexOf('.'))))) continue
    const copy = seatedPatientClip(clip)
    copy.name = 'FemaleVisitor seated activity'
    copy.tracks = copy.tracks.filter(track => {
      const target = track.name.slice(0, track.name.lastIndexOf('.'))
      return names.has(target) && target !== source.children[0].name && target !== source.name
    })
    for (const track of copy.tracks) {
      const split = track.name.lastIndexOf('.')
      track.name = `${names.get(track.name.slice(0, split))}${track.name.slice(split)}`
    }
    scene.animations.push(copy)
  }
  original.name = 'Retired_male_visitor'
  original.visible = false
  original.traverse(node => { if (node instanceof THREE.Mesh) node.userData.retiredVisual = true })
  scene.add(visitor)
}
