import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PALETTE } from '../materials'

export interface InfoPathProps {
  /** orthogonal waypoints on the clinic floor */
  points: [number, number, number][]
  radius?: number
  pulses?: number
  speed?: number
  /** per-frame brightness 0..1, sampled from smoothed journey progress */
  intensity: () => number
}

const tmp = new THREE.Object3D()

/**
 * a machined sage information route: a thin floor trace with small light
 * pulses travelling along it. pulses drift with time, brightness derives
 * from scroll progress, so reversing scroll stays coherent.
 */
export function InfoPath({
  points,
  radius = 0.0042,
  pulses = 3,
  speed = 0.14,
  intensity,
}: InfoPathProps) {
  const pulseRef = useRef<THREE.InstancedMesh>(null)

  const { curve, tube, traceMat, pulseMat } = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>()
    for (let i = 0; i < points.length - 1; i++) {
      path.add(
        new THREE.LineCurve3(
          new THREE.Vector3(...points[i]),
          new THREE.Vector3(...points[i + 1]),
        ),
      )
    }
    const tubeGeo = new THREE.TubeGeometry(path, points.length * 10, radius, 5, false)
    const trace = new THREE.MeshStandardMaterial({
      color: PALETTE.sage,
      emissive: PALETTE.sage,
      emissiveIntensity: 0.4,
      roughness: 0.5,
    })
    const pulse = new THREE.MeshStandardMaterial({
      color: PALETTE.sage,
      emissive: PALETTE.sage,
      emissiveIntensity: 2.4,
      toneMapped: false,
    })
    return { curve: path, tube: tubeGeo, traceMat: trace, pulseMat: pulse }
  }, [points, radius])

  useEffect(
    () => () => {
      tube.dispose()
      traceMat.dispose()
      pulseMat.dispose()
    },
    [tube, traceMat, pulseMat],
  )

  useFrame(({ clock }) => {
    const k = intensity()
    traceMat.emissiveIntensity = 0.18 + k * 1.0
    const mesh = pulseRef.current
    if (!mesh) return
    mesh.visible = k > 0.04
    if (!mesh.visible) return
    const t0 = clock.elapsedTime * speed
    for (let i = 0; i < pulses; i++) {
      const t = (t0 + i / pulses) % 1
      const pt = curve.getPointAt(t)
      tmp.position.copy(pt)
      const s = 0.5 + k * 0.7
      tmp.scale.setScalar(s)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    pulseMat.emissiveIntensity = 1.2 + k * 1.8
  })

  return (
    <group>
      <mesh geometry={tube} material={traceMat} />
      <instancedMesh ref={pulseRef} args={[undefined, undefined, pulses]} material={pulseMat}>
        <boxGeometry args={[0.008, 0.003, 0.008]} />
      </instancedMesh>
    </group>
  )
}
