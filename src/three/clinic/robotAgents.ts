import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const AGENTS = ['Reception_Staff', 'Review_Physician', 'Follow_Coordinator'] as const
const SHELL = '#70777f', JOINT = '#30343b', VISOR = '#141a20', MINT = '#66efc4'

/** Rigid industrial shells on the retained gesture rigs. No new frame writer,
 * texture, animation clock, or asset; the original meshes remain owned for disposal.
 */
export function installRobotAgents(scene: THREE.Group) {
  // Include the enclosing clinic's scale BEFORE caching inverse rig matrices.
  scene.updateWorldMatrix(true, true)
  for (const id of AGENTS) {
    const actor = scene.getObjectByName(id)
    if (!actor || actor.userData.representation === 'omnus-robot') continue
    const bones = new Map<string, THREE.Bone>()
    actor.traverse(node => { if (node instanceof THREE.Bone) bones.set(node.userData.name ?? node.name, node) })
    const bone = (name: string) => {
      const found = bones.get(name)
      if (!found) throw new Error(`Robot ${id}: missing ${name}`)
      return found
    }
    const rig = bone('root').parent!
    const inverseRig = rig.matrixWorld.clone().invert()
    const point = (name: string) => bone(name).getWorldPosition(new THREE.Vector3()).applyMatrix4(inverseRig)
    const batches = new Map<THREE.Bone, THREE.BufferGeometry[]>()
    const add = (name: string, geometry: THREE.BufferGeometry, color: string, position: THREE.Vector3, rotation = new THREE.Quaternion()) => {
      const target = bone(name)
      const matrix = new THREE.Matrix4().compose(position, rotation, new THREE.Vector3(1, 1, 1))
      matrix.premultiply(rig.matrixWorld).premultiply(target.matrixWorld.clone().invert())
      const flat = geometry.index ? geometry.toNonIndexed() : geometry
      if (flat !== geometry) geometry.dispose()
      flat.applyMatrix4(matrix)
      const rgb = new THREE.Color(color), colors = new Float32Array(flat.attributes.position.count * 3)
      for (let i = 0; i < colors.length; i += 3) rgb.toArray(colors, i)
      flat.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      const list = batches.get(target) ?? []
      list.push(flat); batches.set(target, list)
    }
    const box = (name: string, size: [number, number, number], color: string, position: THREE.Vector3) =>
      add(name, new RoundedBoxGeometry(...size, 2, Math.min(...size) * .18), color, position)
    const segment = (start: string, end: string, radius: number) => {
      radius *= .9
      const a = point(start), b = point(end), delta = b.clone().sub(a)
      const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize())
      add(start, new THREE.CylinderGeometry(radius, radius, delta.length() * .83, 12), SHELL, a.clone().lerp(b, .5), rotation)
      for (const t of [.25, .5, .75]) add(start, new THREE.CylinderGeometry(radius * 1.03, radius * 1.03, .012, 12), JOINT, a.clone().lerp(b, t), rotation)
      add(start, new THREE.SphereGeometry(radius * .78, 8, 6), JOINT, a)
    }
    // All sizes are donor metres. Front is rig +Z, measured on the loaded rig.
    const chest = point('spine03').lerp(point('neck01'), .48)
    add('spine03', new THREE.CylinderGeometry(.17, .19, .35, 16), SHELL, chest)
    add('spine05', new THREE.CylinderGeometry(.13, .13, .20, 12), JOINT, point('spine05').add(new THREE.Vector3(0, .075, 0)))
    box('root', [.30, .18, .25], SHELL, point('root').add(new THREE.Vector3(0, -.10, .03)))
    segment('neck01', 'head', .055)
    const head = point('head').add(new THREE.Vector3(0, .09, 0))
    add('head', new THREE.CylinderGeometry(.13, .13, .28, 16), SHELL, head)
    add('head', new THREE.SphereGeometry(.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), SHELL, head.clone().add(new THREE.Vector3(0, .14, 0)))
    box('head', [.245, .105, .06], VISOR, head.clone().add(new THREE.Vector3(0, .05, .13)))
    for (const side of [-1, 1]) {
      add('head', new THREE.SphereGeometry(.039, 12, 8), '#f1f9ee', head.clone().add(new THREE.Vector3(side * .055, .05, .163)))
      add('head', new THREE.SphereGeometry(.016, 8, 6), VISOR, head.clone().add(new THREE.Vector3(side * .055, .05, .197)))
    }
    box('head', [.14, .034, .016], JOINT, head.clone().add(new THREE.Vector3(0, -.065, .13)))
    for (const x of [-.045, 0, .045]) box('head', [.012, .029, .019], SHELL, head.clone().add(new THREE.Vector3(x, -.065, .14)))
    // Wraparound graphite ear actuators keep the silhouette mechanical in profile.
    for (const side of [-1, 1]) box('head', [.045, .095, .105], JOINT, head.clone().add(new THREE.Vector3(side * .15, 0, 0)))
    add('spine03', new THREE.TorusGeometry(.055, .012, 5, 16), MINT, chest.clone().add(new THREE.Vector3(0, .025, .186)))
    box('spine03', [.10, .018, .012], JOINT, chest.clone().add(new THREE.Vector3(0, -.075, .184)))
    for (const side of ['L', 'R']) {
      segment(`upperleg01.${side}`, `lowerleg01.${side}`, .085)
      segment(`lowerleg01.${side}`, `foot.${side}`, .065)
      box(`foot.${side}`, [.12, .09, .23], JOINT, point(`foot.${side}`).add(new THREE.Vector3(0, -.015, .06)))
    }
    // Hide only renderables, never the ancestor that also owns the live bones.
    actor.traverse(node => {
      if (node instanceof THREE.Mesh) { node.visible = false; node.userData.replacedByRobot = true }
    })
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .42, metalness: .25, envMapIntensity: .15 })
    material.name = 'Omnus robot ceramic / graphite / mint'
    for (const [target, parts] of batches) {
      const geometry = mergeGeometries(parts)!
      parts.forEach(part => part.dispose())
      // Compact the shells without moving the seated rig or lifting its feet.
      const name = target.userData.name ?? target.name
      const size = name === 'head' ? .88 : ['spine03', 'spine05', 'root'].includes(name) ? .9 : 1
      geometry.scale(size, size, size)
      geometry.computeBoundingBox(); geometry.computeBoundingSphere()
      const mesh = new THREE.Mesh(geometry, material)
      mesh.name = `${id}__robot__${target.userData.name ?? target.name}`
      mesh.userData.robotPart = true
      mesh.userData.brand = 'Omnus'
      mesh.castShadow = true; mesh.receiveShadow = true
      target.add(mesh)
    }
    actor.userData.representation = 'omnus-robot'
    actor.userData.robotStyle = 'cylindrical-humanoid'
  }
}
