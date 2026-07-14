import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { getMaterials } from '../materials'
import { CLINIC } from '../constants'
import { mulberry32 } from '../../lib/rng'
import { Chair, CoatRail, Counter, Desk, Kiosk, Monitor, SideTable } from './props'

const FLOOR = CLINIC.floorY
const DESK_TOP = FLOOR + 0.081

const N_PAPERS = 10
const N_BLOCKS = 8

interface Pose {
  p: [number, number, number]
  r: [number, number, number]
}

const dummy = new THREE.Object3D()

/**
 * scene 3: reception and intake. scattered intake forms, referral documents
 * and calendar blocks sit in one organized patient thread. the architecture
 * stays physically fixed; the people carry the action.
 */
export function Reception({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const papersRef = useRef<THREE.InstancedMesh>(null)
  const blocksRef = useRef<THREE.InstancedMesh>(null)

  const layouts = useMemo(() => {
    const rand = mulberry32(101)
    const papers: { from: Pose; to: Pose }[] = []
    for (let i = 0; i < N_PAPERS; i++) {
      // loose intake forms live on the desk and the back counter, never the
      // floor: worked paper, not mess
      const onDesk = i < 6
      papers.push({
        from: {
          p: onDesk
            ? [-0.29 + rand() * 0.07, DESK_TOP + rand() * 0.004, 0.26 + rand() * 0.15]
            : [-0.44 + rand() * 0.18, FLOOR + 0.081 + rand() * 0.003, 0.5 + rand() * 0.035],
          r: [0, rand() * 2.4 - 1.2, 0],
        },
        to: {
          p: [-0.305, DESK_TOP + 0.002 + i * 0.0019, 0.345],
          r: [0, -0.12, 0],
        },
      })
    }
    const blocks: { from: Pose; to: Pose }[] = []
    for (let i = 0; i < N_BLOCKS; i++) {
      blocks.push({
        from: {
          p: [-0.52 + rand() * 0.2, 0.145 + rand() * 0.13, 0.142],
          r: [0, 0, (rand() - 0.5) * 0.7],
        },
        to: {
          p: [-0.5 + i * 0.026, 0.225, 0.142],
          r: [0, 0, 0],
        },
      })
    }
    return { papers, blocks }
  }, [])

  useEffect(() => {
    const apply = (
      mesh: THREE.InstancedMesh | null,
      items: { from: Pose; to: Pose }[],
    ) => {
      if (!mesh) return
      const n = items.length
      for (let i = 0; i < n; i++) {
        const { to } = items[i]
        dummy.position.set(...to.p)
        dummy.rotation.set(...to.r)
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
      {/* reception counter facing the corridor */}
      <Desk position={[-0.24, FLOOR, 0.33]} rotationY={-Math.PI / 2} w={0.18} d={0.075} warm />
      <Monitor
        position={[-0.245, DESK_TOP, 0.375]}
        rotationY={Math.PI / 2 + 0.2}
        kind="schedule"
      />
      <Chair position={[-0.31, FLOOR, 0.33]} rotationY={Math.PI / 2} task />

      {/* waiting area along the west wall */}
      <Chair position={[-0.51, FLOOR, 0.45]} rotationY={Math.PI / 2} />
      <Chair position={[-0.51, FLOOR, 0.38]} rotationY={Math.PI / 2} />
      {detailed && <Chair position={[-0.51, FLOOR, 0.31]} rotationY={Math.PI / 2} />}
      {detailed && <SideTable position={[-0.51, FLOOR, 0.23]} />}

      {/* self check-in kiosk near the entrance */}
      <Kiosk position={[-0.17, FLOOR, 0.51]} rotationY={0.9} />

      {/* built-in back counter and staff coats: the room is lived in */}
      <Counter position={[-0.34, FLOOR, 0.52]} rotationY={Math.PI} w={0.32} warm />
      {detailed && <CoatRail position={[-0.2, FLOOR, 0.147]} rotationY={0} />}

      {/* fixed, neatly collated intake forms and referral documents */}
      <instancedMesh ref={papersRef} args={[undefined, undefined, N_PAPERS]} material={mats.paper}>
        <boxGeometry args={[0.021, 0.0013, 0.029]} />
      </instancedMesh>

      {/* calendar blocks on the schedule rail */}
      <mesh position={[-0.42, 0.225, 0.1405]} material={mats.structure}>
        <boxGeometry args={[0.24, 0.003, 0.003]} />
      </mesh>
      <instancedMesh
        ref={blocksRef}
        args={[undefined, undefined, N_BLOCKS]}
        material={mats.furniture}
      >
        <boxGeometry args={[0.02, 0.013, 0.005]} />
      </instancedMesh>
    </group>
  )
}
