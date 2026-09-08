import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

const ASSETS = ['clinic-shell', 'consultation', 'physician-seated', 'patient-seated', 'room-people'] as const

/** An owned scene, not the shared useGLTF cache: cleanup also handles partial loads. */
export async function loadAcceptedModel(base: string, cancelled: () => boolean) {
  const root = new THREE.Group()
  root.name = 'accepted-clinic'
  root.scale.setScalar(0.1)
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  try {
    for (const name of ASSETS) {
      const { scene, animations } = await loader.loadAsync(`${base}models/3d-redesign/${name}.glb`)
      scene.animations = animations
      scene.name = name
      if (name === 'physician-seated') scene.position.set(2.65, 0, 2.1)
      if (name === 'patient-seated') {
        scene.position.set(2.65, 0, 4.35)
        scene.rotation.y = Math.PI
      }
      scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.castShadow = true
          node.receiveShadow = true
          // Bind-pose bounds do not cover travelling/skinned limbs. The six
          // actors are bounded; the whole clinic already hides and pauses.
          if (node instanceof THREE.SkinnedMesh) node.frustumCulled = false
          // Keep the donor's authored PBR maps/scalars. The site's environment
          // is for the metal appliance; it must not wash out the clinic maps.
          for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
            if (material instanceof THREE.MeshStandardMaterial) material.envMapIntensity = 0.15
          }
        }
      })
      root.add(scene)
      if (cancelled()) throw new Error('Clinic load cancelled')
    }
    return root
  } catch (error) {
    disposeModel(root)
    throw error
  }
}

/** Donor's capped vertex cut, adapted to the website's translated floor plane.
 * Only architectural solids deform; complete wall fixtures withdraw before
 * losing their support. Original positions/normals make reversal exact.
 */
export function createWallCutaway(root: THREE.Group) {
  root.updateMatrixWorld(true)
  const floor = root.getWorldPosition(new THREE.Vector3()).y
  const scale = root.getWorldScale(new THREE.Vector3()).y
  const entries: {
    node: THREE.Object3D
    kind: string
    bounds: THREE.Box3
    meshes: { mesh: THREE.Mesh; original: Float32Array; normals: THREE.BufferAttribute | THREE.InterleavedBufferAttribute; world: THREE.Vector3[]; inverse: THREE.Matrix4 }[]
  }[] = []
  root.traverse((node) => {
    const kind = node.userData.architectureKind
    if (!kind) return
    const entry: (typeof entries)[number] = { node, kind, bounds: new THREE.Box3().setFromObject(node), meshes: [] }
    if (kind === 'solid') node.traverse((mesh) => {
      if (!(mesh instanceof THREE.Mesh)) return
      let owner: THREE.Object3D | null = mesh
      while (owner && !owner.userData.architectureKind) owner = owner.parent
      if (owner !== node) return
      const source = mesh.geometry.attributes.position
      const original = new Float32Array(source.count * 3)
      const world = []
      for (let i = 0; i < source.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(source, i)
        v.toArray(original, i * 3)
        world.push(v.applyMatrix4(mesh.matrixWorld))
      }
      mesh.geometry.setAttribute('position', new THREE.BufferAttribute(original.slice(), 3))
      entry.meshes.push({ mesh, original, world, normals: mesh.geometry.attributes.normal.clone(), inverse: mesh.matrixWorld.clone().invert() })
    })
    entries.push(entry)
  })
  const v = new THREE.Vector3()
  let previous = -1
  return (amount: number) => {
    const cut = THREE.MathUtils.clamp(amount, 0, 1)
    if (cut === previous) return
    previous = cut
    const ceiling = floor + (2.35 - 2 * cut) * scale
    for (const { node, kind, bounds, meshes } of entries) {
      node.visible = kind === 'fixture' ? ceiling >= bounds.max.y - 1e-5 : ceiling > bounds.min.y + 1e-6
      for (const { mesh, original, normals, world, inverse } of meshes) {
        const position = mesh.geometry.attributes.position as THREE.BufferAttribute
        if (cut === 0) {
          position.array.set(original)
          mesh.geometry.setAttribute('normal', normals.clone())
        } else {
          for (let i = 0; i < world.length; i++) {
            v.copy(world[i]); v.y = Math.min(v.y, Math.max(ceiling, bounds.min.y))
            v.applyMatrix4(inverse); position.setXYZ(i, v.x, v.y, v.z)
          }
          mesh.geometry.computeVertexNormals()
        }
        position.needsUpdate = true
        mesh.geometry.computeBoundingBox()
        mesh.geometry.computeBoundingSphere()
      }
    }
  }
}

export function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  const skeletons = new Set<THREE.Skeleton>()
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    if (node instanceof THREE.SkinnedMesh) skeletons.add(node.skeleton)
    geometries.add(node.geometry)
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material)
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
    }
  })
  geometries.forEach((geometry) => geometry.dispose())
  skeletons.forEach((skeleton) => skeleton.dispose())
  materials.forEach((material) => material.dispose())
  textures.forEach((texture) => { texture.dispose(); if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) texture.image.close() })
}
