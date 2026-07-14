import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials, PALETTE } from '../materials'
import { CLINIC } from '../constants'
import { mulberry32 } from '../../lib/rng'
import { lerp } from '../../lib/math'
import { smoothedState, sceneT, swin } from '../../scroll/journey'
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
 * and calendar blocks resolve into one organized patient thread as the
 * visitor scrolls through.
 */
export function Reception({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const papersRef = useRef<THREE.InstancedMesh>(null)
  const blocksRef = useRef<THREE.InstancedMesh>(null)

  const threadMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.sage,
        emissive: PALETTE.sage,
        emissiveIntensity: 1.4,
        transparent: true,
        opacity: 0,
      }),
    [],
  )
  useEffect(() => () => threadMat.dispose(), [threadMat])

  const layouts = useMemo(() => {
    const rand = mulberry32(101)
    const papers: { from: Pose; to: Pose }[] = []
    for (let i = 0; i < N_PAPERS; i++) {
      const onDesk = i < 6
      papers.push({
        from: {
          p: [
            -0.42 + rand() * 0.22,
            onDesk ? DESK_TOP + rand() * 0.004 : FLOOR + 0.002,
            0.24 + rand() * 0.24,
          ],
          r: [0, rand() * 2.4 - 1.2, onDesk ? 0 : (rand() - 0.5) * 0.06],
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

  useFrame(() => {
    const p = smoothedState.p
    const s = sceneT(p, 'before')
    const t = swin(s, 0.12, 0.88)

    const apply = (
      mesh: THREE.InstancedMesh | null,
      items: { from: Pose; to: Pose }[],
    ) => {
      if (!mesh) return
      const n = items.length
      for (let i = 0; i < n; i++) {
        // stagger so the room tidies itself piece by piece
        const ti = Math.min(1, Math.max(0, t * 1.6 - (i / n) * 0.6))
        const e = ti * ti * (3 - 2 * ti)
        const { from, to } = items[i]
        dummy.position.set(
          lerp(from.p[0], to.p[0], e),
          lerp(from.p[1], to.p[1], e),
          lerp(from.p[2], to.p[2], e),
        )
        dummy.rotation.set(
          lerp(from.r[0], to.r[0], e),
          lerp(from.r[1], to.r[1], e),
          lerp(from.r[2], to.r[2], e),
        )
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }

    apply(papersRef.current, layouts.papers)
    apply(blocksRef.current, layouts.blocks)

    threadMat.opacity = swin(s, 0.65, 0.95)
  })

  return (
    <group>
      {/* reception counter facing the corridor */}
      <Desk position={[-0.24, FLOOR, 0.33]} rotationY={-Math.PI / 2} w={0.18} d={0.075} />
      <Monitor
        position={[-0.245, DESK_TOP, 0.295]}
        rotationY={Math.PI / 2 + 0.35}
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
      <Counter position={[-0.34, FLOOR, 0.52]} rotationY={Math.PI} w={0.32} />
      {detailed && <CoatRail position={[-0.2, FLOOR, 0.147]} rotationY={0} />}

      {/* intake forms and referral documents, scattered then resolved */}
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

      {/* the organized patient thread, rising from the resolved stack */}
      <mesh position={[-0.305, 0.38, 0.345]} material={threadMat}>
        <cylinderGeometry args={[0.0022, 0.0022, 0.34, 6]} />
      </mesh>
    </group>
  )
}
