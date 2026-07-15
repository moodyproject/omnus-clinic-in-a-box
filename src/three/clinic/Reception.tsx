import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { getMaterials } from '../materials'
import { CLINIC } from '../constants'
import { mulberry32 } from '../../lib/rng'
import {
  AcousticPanel,
  Artwork,
  CoatRail,
  Counter,
  Kiosk,
  Monitor,
  Plant,
  ReceptionDesk,
  SideChair,
  SideTable,
  TaskChair,
  TrayStack,
  WallCabinet,
  WallSign,
  WaterStation,
} from './props'

const FLOOR = CLINIC.floorY
/** staff work surface of the built-in reception desk */
const DESK_TOP = FLOOR + 0.0785

const N_PAPERS = 10
const N_BLOCKS = 8

const dummy = new THREE.Object3D()

/**
 * scene 3: reception and intake. a built-in reception desk faces the room's
 * door, a waiting area with a woven rug holds the west wall, and a staff
 * counter with the day's intake trays runs along the front. the architecture
 * stays physically fixed; the people carry the action.
 */
export function Reception({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const papersRef = useRef<THREE.InstancedMesh>(null)
  const blocksRef = useRef<THREE.InstancedMesh>(null)

  const layouts = useMemo(() => {
    const rand = mulberry32(101)
    // two worked, collated stacks on the staff surface and one on the counter
    const papers = Array.from({ length: N_PAPERS }, (_, i) => {
      const spot =
        i < 4
          ? { x: -0.274, z: 0.302, r: -0.09 }
          : i < 7
            ? { x: -0.271, z: 0.368, r: 0.12 }
            : { x: -0.295, z: 0.512, r: 0.02 }
      const level = i < 4 ? i : i < 7 ? i - 4 : i - 7
      return {
        p: [
          spot.x + (rand() - 0.5) * 0.004,
          (i < 7 ? DESK_TOP + 0.003 : FLOOR + 0.0825) + level * 0.0019,
          spot.z + (rand() - 0.5) * 0.004,
        ] as [number, number, number],
        r: spot.r + (rand() - 0.5) * 0.14,
      }
    })
    // calendar blocks on the schedule rail along the south wall
    const blocks = Array.from({ length: N_BLOCKS }, (_, i) => ({
      p: [-0.5 + i * 0.021, 0.225, 0.1425] as [number, number, number],
      r: 0,
    }))
    return { papers, blocks }
  }, [])

  useEffect(() => {
    const apply = (
      mesh: THREE.InstancedMesh | null,
      items: { p: [number, number, number]; r: number }[],
    ) => {
      if (!mesh) return
      for (let i = 0; i < items.length; i++) {
        dummy.position.set(...items[i].p)
        dummy.rotation.set(0, items[i].r, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }

    apply(papersRef.current, layouts.papers)
    apply(blocksRef.current, layouts.blocks)
  }, [layouts])

  return (
    <group>
      {/* built-in reception desk facing the door; the receptionist works the
          west side, the raised ledge greets the patient on the east */}
      <ReceptionDesk position={[-0.25, FLOOR, 0.33]} rotationY={Math.PI / 2} w={0.2} />
      <Monitor
        position={[-0.264, DESK_TOP, 0.372]}
        rotationY={-Math.PI / 2 + 0.18}
        kind="schedule"
        w={0.065}
        h={0.042}
      />
      <TaskChair position={[-0.302, FLOOR, 0.33]} rotationY={Math.PI / 2} tone="gray" />

      {/* waiting area along the west wall: spaced chairs on a woven rug */}
      <mesh position={[-0.47, FLOOR + 0.0018, 0.39]} material={mats.rug}>
        <boxGeometry args={[0.17, 0.0022, 0.25]} />
      </mesh>
      <SideChair position={[-0.505, FLOOR, 0.46]} rotationY={Math.PI / 2} tone="clay" />
      <SideChair position={[-0.505, FLOOR, 0.4]} rotationY={Math.PI / 2} tone="clay" />
      <SideChair position={[-0.505, FLOOR, 0.34]} rotationY={Math.PI / 2} tone="sage" />
      <SideTable position={[-0.505, FLOOR, 0.275]} />
      {detailed && <Plant position={[-0.52, FLOOR, 0.517]} />}
      <AcousticPanel
        position={[-0.5495, FLOOR + 0.12, 0.39]}
        rotationY={Math.PI / 2}
        w={0.2}
        h={0.065}
        tone="sage"
      />

      {/* self check-in kiosk just inside the door, clear of the parked leaf */}
      <Kiosk position={[-0.196, FLOOR, 0.455]} rotationY={2.5} />

      {/* staff counter along the front wall: intake trays, water for the
          waiting area, closed storage above */}
      <Counter position={[-0.36, FLOOR, 0.517]} rotationY={Math.PI} w={0.3} warm />
      {detailed && (
        <WallCabinet position={[-0.38, FLOOR + 0.2, 0.5445]} rotationY={Math.PI} w={0.24} />
      )}
      <TrayStack position={[-0.24, FLOOR + 0.0815, 0.512]} rotationY={Math.PI} levels={2} />
      <WaterStation position={[-0.465, FLOOR + 0.0815, 0.512]} />
      {detailed && <Artwork position={[-0.245, FLOOR + 0.17, 0.5455]} rotationY={Math.PI} variant={0} />}

      {/* coats by the staff side door */}
      {detailed && <CoatRail position={[-0.22, FLOOR, 0.153]} rotationY={0} />}

      {/* wayfinding sign on the corridor face of the room wall */}
      <WallSign
        position={[-0.1285, FLOOR + 0.19, 0.41]}
        rotationY={Math.PI / 2}
        text="reception"
        w={0.05}
      />

      {/* fixed, neatly collated intake forms and referral documents */}
      <instancedMesh ref={papersRef} args={[undefined, undefined, N_PAPERS]} material={mats.paper}>
        <boxGeometry args={[0.021, 0.0013, 0.029]} />
      </instancedMesh>

      {/* the day's schedule rail on the south wall */}
      <mesh position={[-0.42, 0.225, 0.1425]} material={mats.steel}>
        <boxGeometry args={[0.2, 0.003, 0.003]} />
      </mesh>
      <instancedMesh
        ref={blocksRef}
        args={[undefined, undefined, N_BLOCKS]}
        material={mats.furniture}
      >
        <boxGeometry args={[0.017, 0.013, 0.005]} />
      </instancedMesh>
    </group>
  )
}
