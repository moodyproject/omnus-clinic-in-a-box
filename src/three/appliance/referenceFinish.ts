import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'

/** One-time, enclosure-only reflection studio; never alters the clinic lighting. */
function enclosureEnvironment(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene()
  const surfaces: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[] = []
  const surround = new THREE.Mesh(
    new THREE.SphereGeometry(14, 24, 12),
    new THREE.MeshBasicMaterial({ color: '#55585c', side: THREE.BackSide, toneMapped: false }),
  )
  studio.add(surround)
  surfaces.push(surround)
  const card = (width: number, height: number, position: [number, number, number], radiance: number, target: [number, number, number] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(radiance, radiance, radiance), toneMapped: false }),
    )
    mesh.position.set(...position)
    mesh.lookAt(...target)
    studio.add(mesh)
    surfaces.push(mesh)
  }
  // Put the softbox edge across the hero's reflected field, not over its
  // entire face. Roughness blends that edge into a broad satin gradient.
  card(3, 8, [-6.4, 0, 5], 2.2, [-6.4, 0, 0])
  card(12, 12, [-4, 5, -4], 1.25)
  card(2.7, 8, [5, 0, -9.6], 1.4, [0, 0, -9.6])
  const generator = new THREE.PMREMGenerator(renderer)
  try {
    const target = generator.fromScene(studio, 0.06, 0.1, 30, { size: 128 })
    target.texture.name = 'enclosure-satin-reflections'
    return target
  } finally {
    generator.dispose()
    surfaces.forEach(mesh => { mesh.geometry.dispose(); mesh.material.dispose() })
  }
}

export function useReferenceFinish() {
  const renderer = useThree(state => state.gl)
  const invalidate = useThree(state => state.invalidate)
  const finish = useMemo(() => {
    // Fine anodized micrograin, rather than pronounced brushed stripes.
    const width = 128, height = 128, data = new Uint8Array(width * height * 4)
    let seed = 19
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        seed = (seed * 1664525 + 1013904223) >>> 0
        const i = (y * width + x) * 4
        const value = 126 + seed % 5
        data[i] = data[i + 1] = data[i + 2] = value
        data[i + 3] = 255
      }
    }
    const grain = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping
    grain.magFilter = THREE.LinearFilter
    grain.minFilter = THREE.LinearMipmapLinearFilter
    grain.generateMipmaps = true
    grain.needsUpdate = true
    const silver = new THREE.MeshStandardMaterial({ color: '#b5b7b9', metalness: 1, roughness: 0.5, envMapIntensity: 1.25, bumpMap: grain, bumpScale: 0.00007 })
    const panel = silver.clone()
    panel.roughness = 0.52
    const edge = silver.clone()
    edge.roughness = 0.46
    const dark = new THREE.MeshStandardMaterial({ color: '#111417', metalness: 0.12, roughness: 0.92 })
    return { silver, panel, edge, dark, grain }
  }, [])
  useLayoutEffect(() => {
    const target = enclosureEnvironment(renderer)
    const metals = [finish.silver, finish.panel, finish.edge]
    metals.forEach(material => { material.envMap = target.texture; material.needsUpdate = true })
    invalidate()
    return () => {
      metals.forEach(material => { material.envMap = null; material.needsUpdate = true })
      target.dispose()
    }
  }, [finish, renderer, invalidate])
  useEffect(() => () => {
    finish.silver.dispose(); finish.panel.dispose(); finish.edge.dispose()
    finish.dark.dispose(); finish.grain.dispose()
  }, [finish])
  return finish
}

export type ReferenceFinish = ReturnType<typeof useReferenceFinish>
