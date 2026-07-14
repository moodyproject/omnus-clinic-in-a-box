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
  /** anodized outer enclosure */
  shell: THREE.MeshStandardMaterial
  /** interior faces of the opened panels */
  shellInner: THREE.MeshStandardMaterial
  /** recessed front field behind the ventilation fins */
  inset: THREE.MeshStandardMaterial
  /** base plinth, slightly darker than the shell */
  plinth: THREE.MeshStandardMaterial
  /** ventilation fins and machined ribs */
  fin: THREE.MeshStandardMaterial
  /** clinic floor slab */
  floor: THREE.MeshStandardMaterial
  /** corridor inlay */
  corridor: THREE.MeshStandardMaterial
  /** interior partition walls */
  wall: THREE.MeshStandardMaterial
  /** graphite structural columns, rails, frames */
  structure: THREE.MeshStandardMaterial
  /** machined aluminum of the compute deck above the clinic */
  deck: THREE.MeshStandardMaterial
  /** dark work surfaces */
  deskTop: THREE.MeshStandardMaterial
  /** porcelain furniture bodies */
  furniture: THREE.MeshStandardMaterial
  /** loose documents */
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
    shell: std({ color: '#36393d', metalness: 0.88, roughness: 0.28, envMapIntensity: 1.5 }),
    shellInner: std({ color: '#2e3134', metalness: 0, roughness: 1 }),
    inset: std({ color: '#1d2023', metalness: 0.65, roughness: 0.5, envMapIntensity: 1.1 }),
    plinth: std({ color: '#232629', metalness: 0.78, roughness: 0.4, envMapIntensity: 1.2 }),
    fin: std({ color: '#3a3e42', metalness: 0.82, roughness: 0.38, envMapIntensity: 1.3 }),
    floor: std({ color: '#eae7df', roughness: 0.92 }),
    corridor: std({ color: '#f4f2ec', roughness: 0.88 }),
    wall: std({ color: '#fbfaf7', roughness: 0.95 }),
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
