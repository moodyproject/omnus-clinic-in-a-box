import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { getMaterials } from '../materials'
import { CLINIC } from '../constants'
import { mulberry32 } from '../../lib/rng'
import { Cabinet, WallCabinet, WallDisplay } from './props'

const FLOOR = CLINIC.floorY
const N_SHEETS = 8

const dummy = new THREE.Object3D()

interface SheetPose {
  from: [number, number, number]
  fromR: number
  to: [number, number, number]
  toR: number
}

/**
 * scene 6: follow-through. the coordinator (people layer) works the room
 * beside fixed, orderly referral and patient-instruction stations.
 */
export function FollowThrough({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const sheetsRef = useRef<THREE.InstancedMesh>(null)

  const layout = useMemo<SheetPose[]>(() => {
    const rand = mulberry32(404)
    return Array.from({ length: N_SHEETS }, (_, i) => {
      const toTray = i < 5
      return toTray
        ? {
            // referral sheets: scattered on the cabinet top -> the out-tray
            from: [-0.46 + rand() * 0.1, FLOOR + 0.097 + rand() * 0.003, -0.52 + rand() * 0.06],
            fromR: rand() * 1.6 - 0.8,
            to: [-0.525, FLOOR + 0.062 + (i % 5) * 0.004, -0.24 - 0.005 + (i % 5) * 0.006],
            toR: Math.PI / 2,
          }
        : {
            // patient instructions: loose -> a neat stack under the display
            from: [-0.3 + rand() * 0.12, FLOOR + 0.002, -0.44 - rand() * 0.06],
            fromR: rand() * 2 - 1,
            to: [-0.22, FLOOR + 0.002 + (i - 5) * 0.0022, -0.5],
            toR: 0,
          }
    })
  }, [])

  useEffect(() => {
    const mesh = sheetsRef.current
    if (!mesh) return
    for (let i = 0; i < N_SHEETS; i++) {
      const d = layout[i]
      dummy.position.set(...d.to)
      dummy.rotation.set(0, d.toR, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [layout])

  return (
    <group>
      {/* stations built into the room */}
      <WallDisplay position={[-0.22, 0.27, -0.545]} rotationY={0} kind="kiosk" w={0.07} h={0.09} />
      <Cabinet position={[-0.42, FLOOR, -0.5]} rotationY={0} openDrawer />
      {detailed && (
        <WallCabinet position={[-0.32, FLOOR + 0.21, -0.55]} rotationY={0} w={0.16} />
      )}
      {/* referral out-tray, angled */}
      <group position={[-0.525, FLOOR, -0.24]} rotation-y={Math.PI / 2}>
        <mesh position={[0, 0.05, 0]} rotation-x={-0.35} material={mats.structure}>
          <boxGeometry args={[0.06, 0.004, 0.08]} />
        </mesh>
      </group>
      {/* follow-up queue board on the west wall */}
      <WallDisplay
        position={[-0.545, 0.27, -0.42]}
        rotationY={Math.PI / 2}
        kind="inbox"
        w={0.11}
        h={0.068}
      />
      {detailed && (
        <mesh position={[-0.36, FLOOR + 0.001, -0.44]} material={mats.corridor}>
          <boxGeometry args={[0.2, 0.002, 0.16]} />
        </mesh>
      )}

      {/* fixed collated paperwork; only the coordinator moves */}
      <instancedMesh ref={sheetsRef} args={[undefined, undefined, N_SHEETS]} material={mats.paper}>
        <boxGeometry args={[0.021, 0.0014, 0.029]} />
      </instancedMesh>
    </group>
  )
}
