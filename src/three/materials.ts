import * as THREE from 'three'
import { makeTerrazzoTexture, makeWeaveTexture } from './textures'

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
  /** clinic floor field (the service apron around the rooms) */
  floor: THREE.MeshStandardMaterial
  /** corridor inlay: calm terrazzo-like mineral surface */
  corridor: THREE.MeshStandardMaterial
  /** woven inset rug for the waiting area */
  rug: THREE.MeshStandardMaterial
  /** interior partition walls: warm off-white, clearly lighter than floors */
  wall: THREE.MeshStandardMaterial
  /** warm architectural trim used for wall caps and door frames */
  wallTrim: THREE.MeshStandardMaterial
  /** warm seamless resilient floor in patient-facing rooms */
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
  /** pale natural-wood fronts: door leaves and warm cabinetry */
  woodDoor: THREE.MeshStandardMaterial
  /** warm ivory cabinetry bodies and built-ins */
  cabinet: THREE.MeshStandardMaterial
  /** light mineral-composite countertops */
  counterTop: THREE.MeshStandardMaterial
  /** satin graphite furniture frames and legs */
  frame: THREE.MeshStandardMaterial
  /** brushed stainless fixtures: faucets, rails, instruments */
  steel: THREE.MeshStandardMaterial
  /** muted sage upholstery (clinical seating) */
  upholSage: THREE.MeshStandardMaterial
  /** warm clay upholstery (waiting seating) */
  upholClay: THREE.MeshStandardMaterial
  /** warm gray upholstery (task chairs) */
  upholGray: THREE.MeshStandardMaterial
  /** porcelain furniture bodies */
  furniture: THREE.MeshStandardMaterial
  /** loose documents and lab coats */
  paper: THREE.MeshStandardMaterial
  /** dark bezel around screens */
  bezel: THREE.MeshStandardMaterial
  /** soft green foliage for the restrained plants */
  leaf: THREE.MeshStandardMaterial
  /** matte ceramic planters and vessels */
  ceramic: THREE.MeshStandardMaterial
  /** the single sage accent, emissive */
  sage: THREE.MeshStandardMaterial
  dispose(): void
}

let cache: Materials | null = null

export function getMaterials(): Materials {
  if (cache) return cache

  const std = (opts: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(opts)

  const sageColor = new THREE.Color(PALETTE.sage)

  const terrazzo = makeTerrazzoTexture()
  terrazzo.wrapS = terrazzo.wrapT = THREE.RepeatWrapping
  terrazzo.repeat.set(5, 5)
  const weave = makeWeaveTexture()
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping
  weave.repeat.set(3, 3)

  const mats: Materials = {
    shell: std({ color: '#4a4e54', metalness: 0.85, roughness: 0.34, envMapIntensity: 1.35 }),
    shellTrim: std({ color: '#33363b', metalness: 0.8, roughness: 0.42, envMapIntensity: 1.1 }),
    shellInner: std({ color: '#33363a', metalness: 0, roughness: 0.95 }),
    inset: std({ color: '#232629', metalness: 0.6, roughness: 0.5, envMapIntensity: 1.0 }),
    chassis: std({ color: '#2b2e32', metalness: 0.75, roughness: 0.38, envMapIntensity: 1.15 }),
    fin: std({ color: '#5a5f66', metalness: 0.82, roughness: 0.36, envMapIntensity: 1.3 }),
    floor: std({ color: '#cfc7b4', roughness: 0.94 }),
    corridor: std({ color: '#e6e3da', roughness: 0.62, map: terrazzo }),
    rug: std({ color: '#bfb197', roughness: 1, map: weave }),
    wall: std({ color: '#f4efe4', roughness: 0.92 }),
    wallTrim: std({ color: '#b3a284', metalness: 0.05, roughness: 0.7 }),
    roomWarm: std({ color: '#ddd0b8', roughness: 0.82 }),
    roomMineral: std({ color: '#d6d4c9', roughness: 0.8 }),
    structure: std({ color: '#4b5053', metalness: 0.45, roughness: 0.55 }),
    deck: std({ color: '#3c4045', metalness: 0.75, roughness: 0.32, envMapIntensity: 1.5 }),
    deskTop: std({ color: '#33363a', metalness: 0.3, roughness: 0.45 }),
    oak: std({ color: '#ab8a5e', roughness: 0.62 }),
    woodDoor: std({ color: '#c8a878', roughness: 0.58 }),
    cabinet: std({ color: '#ebe3d1', roughness: 0.68 }),
    counterTop: std({ color: '#eeeadf', roughness: 0.38 }),
    frame: std({ color: '#3e4246', metalness: 0.62, roughness: 0.44, envMapIntensity: 1.1 }),
    steel: std({ color: '#aeb2b4', metalness: 0.92, roughness: 0.34, envMapIntensity: 1.4 }),
    upholSage: std({ color: '#7d938a', roughness: 0.92 }),
    upholClay: std({ color: '#ad846a', roughness: 0.92 }),
    upholGray: std({ color: '#8f8a81', roughness: 0.92 }),
    furniture: std({ color: '#efece4', roughness: 0.85 }),
    paper: std({ color: '#fbfaf7', roughness: 1, side: THREE.DoubleSide }),
    bezel: std({ color: '#141619', metalness: 0.5, roughness: 0.45 }),
    leaf: std({ color: '#5f7a63', roughness: 0.95 }),
    ceramic: std({ color: '#d9d2c2', roughness: 0.72 }),
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
      terrazzo.dispose()
      weave.dispose()
      cache = null
    },
  }

  cache = mats
  return mats
}
