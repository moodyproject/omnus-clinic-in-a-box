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
  /** graphite structural trims, rails, frames */
  structure: THREE.MeshStandardMaterial
  /** machined aluminum shelving and racks */
  deck: THREE.MeshStandardMaterial
  /** dark work surfaces */
  deskTop: THREE.MeshStandardMaterial
  /** porcelain furniture bodies */
  furniture: THREE.MeshStandardMaterial
  /** loose documents and lab coats */
  paper: THREE.MeshStandardMaterial
  /** dark bezel around screens */
  bezel: THREE.MeshStandardMaterial
  /** the single sage accent, emissive */
  sage: THREE.MeshStandardMaterial
  /** dimmer sage for floor information paths */
  sagePath: THREE.MeshStandardMaterial
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
    floor: std({ color: '#e7e3d9', roughness: 0.92 }),
    corridor: std({ color: '#f3f1eb', roughness: 0.88 }),
    rug: std({ color: '#ddd8ca', roughness: 0.96 }),
    wall: std({ color: '#fcfbf8', roughness: 0.95 }),
    structure: std({ color: '#26282c', metalness: 0.65, roughness: 0.5 }),
    deck: std({ color: '#3c4045', metalness: 0.75, roughness: 0.32, envMapIntensity: 1.5 }),
    deskTop: std({ color: '#2b2e32', metalness: 0.35, roughness: 0.5 }),
    furniture: std({ color: '#efece4', roughness: 0.85 }),
    paper: std({ color: '#fbfaf7', roughness: 1, side: THREE.DoubleSide }),
    bezel: std({ color: '#141619', metalness: 0.5, roughness: 0.45 }),
    sage: std({
      color: sageColor,
      emissive: sageColor,
      emissiveIntensity: 1.1,
      roughness: 0.45,
    }),
    sagePath: std({
      color: sageColor,
      emissive: sageColor,
      emissiveIntensity: 0.55,
      roughness: 0.5,
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
