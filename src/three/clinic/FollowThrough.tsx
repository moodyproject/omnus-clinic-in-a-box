import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { getMaterials } from '../materials'
import { CLINIC } from '../constants'
import { mulberry32 } from '../../lib/rng'
import { makeLabelTexture, useFontsReady } from '../textures'
import {
  AcousticPanel,
  Cabinet,
  Monitor,
  Plant,
  Printer,
  TallCabinet,
  TaskChair,
  TrayStack,
  WallCabinet,
  WallDisplay,
  WallSign,
} from './props'

const FLOOR = CLINIC.floorY
const COUNTER_TOP = FLOOR + 0.0815
const N_SHEETS = 8

const dummy = new THREE.Object3D()

const ZONES = ['scheduling', 'referrals', 'instructions'] as const

/**
 * scene 6: follow-through. the coordinator (people layer) works a built-in
 * coordination counter with labeled zones for scheduling, referrals, and
 * patient instructions, plus fixed status boards on the walls.
 */
export function FollowThrough({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const sheetsRef = useRef<THREE.InstancedMesh>(null)
  const fontsReady = useFontsReady()

  const zoneTextures = useMemo(
    () => ZONES.map((t) => makeLabelTexture(t, { color: 'rgba(17, 19, 21, 0.55)', size: 44 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fontsReady],
  )
  useEffect(() => () => zoneTextures.forEach((t) => t.dispose()), [zoneTextures])

  const layout = useMemo(() => {
    const rand = mulberry32(404)
    return Array.from({ length: N_SHEETS }, (_, i) => {
      if (i < 4) {
        // worked referral sheets collated beside the printer
        return {
          p: [-0.283, COUNTER_TOP + 0.002 + i * 0.002, -0.508] as [number, number, number],
          r: [0, (rand() - 0.5) * 0.1, 0] as [number, number, number],
        }
      }
      // patient-instruction sheets collated on the counter under the board
      return {
        p: [-0.225, COUNTER_TOP + 0.002 + (i - 4) * 0.002, -0.514] as [number, number, number],
        r: [0, (rand() - 0.5) * 0.12, 0] as [number, number, number],
      }
    })
  }, [])

  useEffect(() => {
    const mesh = sheetsRef.current
    if (!mesh) return
    for (let i = 0; i < N_SHEETS; i++) {
      const d = layout[i]
      dummy.position.set(...d.p)
      dummy.rotation.set(...d.r)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [layout])

  return (
    <group>
      {/* the coordination counter built along the back wall */}
      <group>
        {/* kick + body + top, one continuous built-in */}
        <mesh position={[-0.36, FLOOR + 0.011, -0.523]} material={mats.structure}>
          <boxGeometry args={[0.32, 0.022, 0.05]} />
        </mesh>
        <mesh position={[-0.36, FLOOR + 0.049, -0.519]} material={mats.cabinet}>
          <boxGeometry args={[0.34, 0.054, 0.062]} />
        </mesh>
        <mesh position={[-0.36, FLOOR + 0.0785, -0.519]} material={mats.counterTop}>
          <boxGeometry args={[0.348, 0.006, 0.068]} />
        </mesh>
        {/* door seams + pulls */}
        {[-0.46, -0.36, -0.26].map((x) => (
          <mesh key={x} position={[x, FLOOR + 0.049, -0.4875]} material={mats.bezel}>
            <boxGeometry args={[0.0015, 0.048, 0.001]} />
          </mesh>
        ))}
        {[-0.41, -0.31].map((x) => (
          <mesh key={x} position={[x, FLOOR + 0.066, -0.487]} material={mats.steel}>
            <boxGeometry args={[0.012, 0.002, 0.002]} />
          </mesh>
        ))}
      </group>

      {/* the coordinator's spot: status monitor, worked trays, printer */}
      <Monitor position={[-0.42, COUNTER_TOP, -0.532]} rotationY={0} kind="status" w={0.06} h={0.038} />
      <TrayStack position={[-0.352, COUNTER_TOP, -0.526]} levels={3} />
      <TrayStack position={[-0.297, COUNTER_TOP, -0.526]} levels={2} />
      <Printer position={[-0.253, COUNTER_TOP, -0.524]} rotationY={0} />
      {detailed && (
        <WallCabinet position={[-0.38, FLOOR + 0.2, -0.5445]} rotationY={0} w={0.26} />
      )}

      {/* engraved zone labels on the counter's front edge */}
      {ZONES.map((zone, i) => (
        <mesh
          key={zone}
          position={[-0.42 + i * 0.08, FLOOR + 0.0835, -0.4855]}
          rotation-x={-Math.PI / 2 + 0.45}
        >
          <planeGeometry args={[0.046, 0.0115]} />
          <meshBasicMaterial map={zoneTextures[i]} transparent depthWrite={false} />
        </mesh>
      ))}

      {/* a parked task chair keeps the station human (clear of her route) */}
      <TaskChair position={[-0.46, FLOOR, -0.47]} rotationY={0.35} tone="clay" />

      {/* patient-instruction board over the counter's east end */}
      <WallDisplay position={[-0.225, 0.275, -0.5445]} rotationY={0} kind="kiosk" w={0.07} h={0.088} />

      {/* referral out-rack on the west wall: two slots of outgoing sheets */}
      <group position={[-0.5465, FLOOR + 0.105, -0.24]} rotation-y={Math.PI / 2}>
        <mesh position={[0, 0, -0.004]} material={mats.cabinet}>
          <boxGeometry args={[0.07, 0.056, 0.004]} />
        </mesh>
        {[-0.014, 0.018].map((y, slot) => (
          <group key={y} position={[0, y, 0.001]} rotation-x={0.3}>
            {/* steel slot lip with a sheet standing in it */}
            <mesh position={[0, -0.007, 0.004]} material={mats.steel}>
              <boxGeometry args={[0.062, 0.014, 0.0014]} />
            </mesh>
            <mesh position={[0, 0.001, 0.0018]} rotation-y={slot === 0 ? 0.03 : -0.04} material={mats.paper}>
              <boxGeometry args={[0.052, 0.026, 0.0012]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* follow-up queue board on the west wall */}
      <WallDisplay
        position={[-0.5455, 0.27, -0.42]}
        rotationY={Math.PI / 2}
        kind="inbox"
        w={0.11}
        h={0.068}
      />

      {/* closed storage flanking the door, low cabinet + plant in the corner */}
      <TallCabinet position={[-0.21, FLOOR, -0.177]} rotationY={Math.PI} />
      <Cabinet position={[-0.522, FLOOR, -0.155]} rotationY={Math.PI / 2} w={0.09} />
      {detailed && <Plant position={[-0.522, FLOOR + 0.085, -0.155]} size={0.7} />}
      {detailed && (
        <AcousticPanel
          position={[-0.4, FLOOR + 0.13, -0.1525]}
          rotationY={Math.PI}
          w={0.16}
          h={0.06}
          tone="sage"
        />
      )}
      <WallSign
        position={[-0.1285, FLOOR + 0.19, -0.41]}
        rotationY={Math.PI / 2}
        text="follow-through"
        w={0.062}
      />

      {/* fixed collated paperwork; only the coordinator moves */}
      <instancedMesh ref={sheetsRef} args={[undefined, undefined, N_SHEETS]} material={mats.paper}>
        <boxGeometry args={[0.021, 0.0014, 0.029]} />
      </instancedMesh>
    </group>
  )
}
