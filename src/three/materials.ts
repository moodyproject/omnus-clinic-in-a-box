import * as THREE from 'three'

/** brand palette, mirrored from src/styles/tokens.css */
export const PALETTE = {
  graphite: '#111315',
  porcelain: '#f2f0ea',
  softWhite: '#fbfaf7',
  sage: '#6f8f83',
  ink2: '#5f6461',
} as const

export interface Materials {
  /** satin anodized gunmetal outer sleeve */
  shell: THREE.MeshStandardMaterial
  /** darker machined trim on the sleeve (chamfers, reveals) */
  shellTrim: THREE.MeshStandardMaterial
  /** interior faces of the lifted sleeve */
  shellInner: THREE.MeshStandardMaterial
  /** recessed fields behind ventilation and ports */
  inset: THREE.MeshStandardMaterial
  /** chassis base: darker than the sleeve, becomes the clinic slab */
  chassis: THREE.MeshStandardMaterial
  /** ventilation fins and machined ribs */
  fin: THREE.MeshStandardMaterial
  /** clinic floor field */
  floor: THREE.MeshStandardMaterial
  /** corridor inlay */
  corridor: THREE.MeshStandardMaterial
  /** warmer room inlays (rugs, mats) */
  rug: THREE.MeshStandardMaterial
  /** interior partition walls */
  wall: THREE.MeshStandardMaterial
  /** warm architectural trim used for wall caps and door frames */
  wallTrim: THREE.MeshStandardMaterial
  /** subtle warm floor used in patient-facing rooms */
  roomWarm: THREE.MeshStandardMaterial
  /** quieter mineral floor used in work rooms */
  roomMineral: THREE.MeshStandardMaterial
  /** graphite structural trims, rails, frames */
  structure: THREE.MeshStandardMaterial
  /** machined aluminum shelving and racks */
  deck: THREE.MeshStandardMaterial
  /** dark work surfaces */
  deskTop: THREE.MeshStandardMaterial
  /** warm oak surfaces: reception counters and waiting-area furniture */
  oak: THREE.MeshStandardMaterial
  /** porcelain furniture bodies */
  furniture: THREE.MeshStandardMaterial
  /** loose documents and lab coats */
  paper: THREE.MeshStandardMaterial
  /** dark bezel around screens */
  bezel: THREE.MeshStandardMaterial
  /** the single sage accent, emissive */
  sage: THREE.MeshStandardMaterial
  dispose(): void
}

let cache: Materials | null = null

export function getMaterials(): Materials {
  if (cache) return cache

  const std = (opts: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(opts)

  const sageColor = new THREE.Color(PALETTE.sage)

  const mats: Materials = {
    shell: std({ color: '#4a4e54', metalness: 0.85, roughness: 0.34, envMapIntensity: 1.35 }),
    shellTrim: std({ color: '#33363b', metalness: 0.8, roughness: 0.42, envMapIntensity: 1.1 }),
    shellInner: std({ color: '#33363a', metalness: 0, roughness: 0.95 }),
    inset: std({ color: '#232629', metalness: 0.6, roughness: 0.5, envMapIntensity: 1.0 }),
    chassis: std({ color: '#2b2e32', metalness: 0.75, roughness: 0.38, envMapIntensity: 1.15 }),
    fin: std({ color: '#5a5f66', metalness: 0.82, roughness: 0.36, envMapIntensity: 1.3 }),
    floor: std({ color: '#d8d1c1', roughness: 0.94 }),
    corridor: std({ color: '#eeeae0', roughness: 0.9 }),
    rug: std({ color: '#c9bfa9', roughness: 0.98 }),
    wall: std({ color: '#f6f2e9', roughness: 0.94 }),
    wallTrim: std({ color: '#b9ab92', metalness: 0.08, roughness: 0.72 }),
    roomWarm: std({ color: '#e4dac7', roughness: 0.96 }),
    roomMineral: std({ color: '#d9d9d2', roughness: 0.94 }),
    structure: std({ color: '#555a5d', metalness: 0.42, roughness: 0.58 }),
    deck: std({ color: '#3c4045', metalness: 0.75, roughness: 0.32, envMapIntensity: 1.5 }),
    deskTop: std({ color: '#2b2e32', metalness: 0.35, roughness: 0.5 }),
    oak: std({ color: '#a8895f', roughness: 0.72 }),
    furniture: std({ color: '#efece4', roughness: 0.85 }),
    paper: std({ color: '#fbfaf7', roughness: 1, side: THREE.DoubleSide }),
    bezel: std({ color: '#141619', metalness: 0.5, roughness: 0.45 }),
    sage: std({
      color: sageColor,
      emissive: sageColor,
      emissiveIntensity: 1.1,
      roughness: 0.45,
    }),
    dispose() {
      for (const value of Object.values(mats)) {
        if (value instanceof THREE.Material) value.dispose()
      }
      cache = null
    },
  }

  cache = mats
  return mats
}
