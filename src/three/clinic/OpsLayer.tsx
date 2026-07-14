import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials } from '../materials'
import { CLINIC } from '../constants'
import { mulberry32 } from '../../lib/rng'
import { lerp } from '../../lib/math'
import { smoothedState, sceneT, swin } from '../../scroll/journey'
import { Monitor } from './props'

const FLOOR = CLINIC.floorY
const N_DOCS = 24

const dummy = new THREE.Object3D()

interface DocPose {
  from: [number, number, number]
  fromR: number
  to: [number, number, number]
}

/**
 * scene 7: the work behind the care. administrative paper scattered along
 * the circulation routes resolves into four calm queues at the scheduling
 * rack, the inbox nook, and the coding and reports stacks by the core.
 */
export function OpsLayer({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const docsRef = useRef<THREE.InstancedMesh>(null)

  const layout = useMemo<DocPose[]>(() => {
    const rand = mulberry32(303)
    const stacks: [number, number][] = [
      [-0.44, 0.05], // scheduling
      [0.44, 0.05], // inbox
      [0.2, -0.065], // coding and billing
      [-0.2, -0.065], // reports
    ]
    return Array.from({ length: N_DOCS }, (_, i) => {
      const stack = stacks[i % 4]
      const j = Math.floor(i / 4)
      // scattered along the corridors
      const alongLateral = rand() > 0.45
      const from: [number, number, number] = alongLateral
        ? [-0.5 + rand() * 1.0, FLOOR + 0.002, -0.09 + rand() * 0.18]
        : [-0.1 + rand() * 0.2, FLOOR + 0.002, -0.05 + rand() * 0.55]
      return {
        from,
        fromR: rand() * 2.6 - 1.3,
        to: [stack[0], FLOOR + 0.002 + j * 0.0022, stack[1]],
      }
    })
  }, [])

  useFrame(() => {
    const p = smoothedState.p
    const s = sceneT(p, 'ops')
    const t = swin(s, 0.12, 0.78)
    const mesh = docsRef.current
    if (!mesh) return
    for (let i = 0; i < N_DOCS; i++) {
      const ti = Math.min(1, Math.max(0, t * 1.5 - (i / N_DOCS) * 0.5))
      const e = ti * ti * (3 - 2 * ti)
      const d = layout[i]
      dummy.position.set(
        lerp(d.from[0], d.to[0], e),
        lerp(d.from[1], d.to[1], e),
        lerp(d.from[2], d.to[2], e),
      )
      dummy.rotation.set(0, lerp(d.fromR, 0, e), 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      {/* scheduling rack at the west end of the cross corridor */}
      <group position={[-0.52, FLOOR, 0]}>
        {[0.05, 0.1, 0.15].map((y) => (
          <mesh key={y} position={[0, y, 0]} material={mats.deck}>
            <boxGeometry args={[0.05, 0.005, 0.16]} />
          </mesh>
        ))}
        {[-0.075, 0.075].map((z) => (
          <mesh key={z} position={[0, 0.085, z]} material={mats.deck}>
            <boxGeometry args={[0.05, 0.17, 0.008]} />
          </mesh>
        ))}
        {detailed &&
          [0.062, 0.112].map((y, i) => (
            <mesh key={i} position={[0, y, -0.03 + i * 0.05]} material={mats.furniture}>
              <boxGeometry args={[0.04, 0.014, 0.05]} />
            </mesh>
          ))}
      </group>

      {/* inbox nook at the east end */}
      <group position={[0.52, FLOOR, 0]}>
        <mesh position={[0, 0.09, 0]} material={mats.deskTop}>
          <boxGeometry args={[0.045, 0.005, 0.14]} />
        </mesh>
        {[-0.06, 0.06].map((z) => (
          <mesh key={z} position={[0, 0.045, z]} material={mats.furniture}>
            <boxGeometry args={[0.04, 0.09, 0.01]} />
          </mesh>
        ))}
      </group>
      <Monitor position={[0.52, FLOOR + 0.095, 0.02]} rotationY={-Math.PI / 2} kind="inbox" w={0.07} h={0.045} />

      {/* administrative load, resolving into queues */}
      <instancedMesh ref={docsRef} args={[undefined, undefined, N_DOCS]} material={mats.paper}>
        <boxGeometry args={[0.017, 0.0016, 0.023]} />
      </instancedMesh>
    </group>
  )
}
