import * as THREE from 'three'
import { useEffect, useState } from 'react'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

/**
 * lazy cache for the character glbs (see ASSETS.md for provenance).
 * loading starts on first request, after the hero has already painted, so the
 * closed-appliance view never waits on people. results are shared: each
 * outfit is fetched and parsed once, then cloned per cast member.
 */

export type OutfitId =
  | 'w_casual'
  | 'w_formal'
  | 'w_suit'
  | 'w_worker'
  | 'm_casual2'
  | 'm_casualhoodie'
  | 'm_suit'
  | 'm_worker'

let loader: GLTFLoader | null = null
const cache = new Map<OutfitId, Promise<GLTF>>()

function getLoader(): GLTFLoader {
  if (!loader) {
    loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
  }
  return loader
}

export function loadOutfit(outfit: OutfitId): Promise<GLTF> {
  let entry = cache.get(outfit)
  if (!entry) {
    const url = `${import.meta.env.BASE_URL}characters/${outfit}.glb`
    entry = getLoader().loadAsync(url)
    cache.set(outfit, entry)
  }
  return entry
}

/** resolves to the parsed gltf, or null while loading / on failure */
export function useOutfit(outfit: OutfitId): GLTF | null {
  const [gltf, setGltf] = useState<GLTF | null>(null)
  useEffect(() => {
    let mounted = true
    loadOutfit(outfit)
      .then((g) => {
        if (mounted) setGltf(g)
      })
      .catch((err) => {
        // people are an enhancement layer: the clinic still reads without
        // them, so a failed fetch logs and degrades instead of breaking
        console.error(`character "${outfit}" failed to load`, err)
      })
    return () => {
      mounted = false
    }
  }, [outfit])
  return gltf
}

const tmpColor = new THREE.Color()

/**
 * restyle a cloned character: every named source material is replaced with a
 * matte standard material in the site's restrained palette, so the cast reads
 * as one architectural-model population rather than game characters.
 */
export function applyWardrobe(
  root: THREE.Object3D,
  colors: Record<string, string>,
  fallback: string,
): void {
  const materialCache = new Map<string, THREE.MeshStandardMaterial>()
  root.traverse((obj) => {
    const mesh = obj as THREE.SkinnedMesh
    if (!mesh.isMesh && !(mesh as THREE.Object3D as THREE.SkinnedMesh).isSkinnedMesh) return
    if (!mesh.material) return
    const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const replaced = source.map((mat) => {
      const name = mat.name || 'unnamed'
      let out = materialCache.get(name)
      if (!out) {
        const hex = colors[name] ?? fallback
        tmpColor.set(hex)
        out = new THREE.MeshStandardMaterial({
          name,
          color: tmpColor.clone(),
          roughness: 0.88,
          metalness: 0,
        })
        materialCache.set(name, out)
      }
      return out
    })
    mesh.material = Array.isArray(mesh.material) ? replaced : replaced[0]
    mesh.frustumCulled = false
    mesh.castShadow = false
    mesh.receiveShadow = false
  })
}
