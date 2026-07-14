import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials, PALETTE } from '../materials'
import { CLINIC } from '../constants'
import { mulberry32 } from '../../lib/rng'
import { lerp } from '../../lib/math'
import { smoothedState, sceneT, swin, win } from '../../scroll/journey'
import { makeLabelTexture, useFontsReady } from '../textures'
import { Chair, Desk, DeskLamp, Monitor, Mug, Shelf } from './props'

const FLOOR = CLINIC.floorY
const DESK_TOP = FLOOR + 0.081

const SOAP = ['subjective', 'objective', 'assessment', 'plan']
const N_FRAGMENTS = 16

const dummy = new THREE.Object3D()

/**
 * scene 5: the review station. clinical fragments arrive from the exam room
 * and organize into the four soap regions engraved in the desk. a thin sage
 * approval gate fills only when the physician signs off; the exit gate to the
 * follow-through room lights at the same moment.
 */
export function ReviewStation() {
  const mats = getMaterials()
  const fontsReady = useFontsReady()
  const fragmentsRef = useRef<THREE.InstancedMesh>(null)
  const approvalRef = useRef<THREE.Mesh>(null)

  const fragMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.sage,
        emissive: PALETTE.sage,
        emissiveIntensity: 1.1,
      }),
    [],
  )
  const gateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.sage,
        emissive: PALETTE.sage,
        emissiveIntensity: 0.2,
      }),
    [],
  )
  const approvedMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  )

  const soapTextures = useMemo(
    () => SOAP.map((t) => makeLabelTexture(t, { color: 'rgba(17, 19, 21, 0.5)', size: 46 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fontsReady],
  )
  const approvedTexture = useMemo(
    () =>
      makeLabelTexture('approved by the physician', {
        color: 'rgba(111, 143, 131, 1)',
        size: 34,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fontsReady],
  )

  useEffect(() => {
    approvedMat.map = approvedTexture
    approvedMat.needsUpdate = true
  }, [approvedMat, approvedTexture])

  useEffect(
    () => () => {
      fragMat.dispose()
      gateMat.dispose()
      approvedMat.dispose()
      soapTextures.forEach((t) => t.dispose())
      approvedTexture.dispose()
    },
    [fragMat, gateMat, approvedMat, soapTextures, approvedTexture],
  )

  // fragment start poses (drifting in from the exam room) and target grids
  const layout = useMemo(() => {
    const rand = mulberry32(202)
    const plateCenters: [number, number][] = [
      [0.295, -0.425],
      [0.385, -0.425],
      [0.295, -0.475],
      [0.385, -0.475],
    ]
    return Array.from({ length: N_FRAGMENTS }, (_, i) => {
      const plate = plateCenters[i % 4]
      const j = Math.floor(i / 4)
      const to: [number, number, number] = [
        plate[0] + ((j % 2) - 0.5) * 0.02,
        DESK_TOP + 0.006,
        plate[1] + (Math.floor(j / 2) - 0.5) * 0.014,
      ]
      const from: [number, number, number] = [
        to[0] + 0.02 + rand() * 0.08,
        to[1] + 0.1 + rand() * 0.08,
        to[2] + 0.28 + rand() * 0.12,
      ]
      const mid: [number, number, number] = [
        (from[0] + to[0]) / 2,
        Math.max(from[1], to[1]) + 0.05,
        (from[2] + to[2]) / 2,
      ]
      return { from, mid, to }
    })
  }, [])

  useFrame(() => {
    const p = smoothedState.p
    const s = sceneT(p, 'review')
    const arrive = swin(s, 0.08, 0.62)
    const approve = swin(s, 0.68, 0.9)

    const mesh = fragmentsRef.current
    if (mesh) {
      for (let i = 0; i < N_FRAGMENTS; i++) {
        const ti = Math.min(1, Math.max(0, arrive * 1.5 - (i / N_FRAGMENTS) * 0.5))
        const e = ti * ti * (3 - 2 * ti)
        const { from, mid, to } = layout[i]
        // quadratic bezier so fragments settle in an arc
        const ax = lerp(from[0], mid[0], e)
        const ay = lerp(from[1], mid[1], e)
        const az = lerp(from[2], mid[2], e)
        const bx = lerp(mid[0], to[0], e)
        const by = lerp(mid[1], to[1], e)
        const bz = lerp(mid[2], to[2], e)
        dummy.position.set(lerp(ax, bx, e), lerp(ay, by, e), lerp(az, bz, e))
        dummy.scale.setScalar(0.25 + e * 0.75)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }

    // the approval bar fills; the exit gate brightens with it
    if (approvalRef.current) {
      approvalRef.current.scale.x = Math.max(0.001, approve)
    }
    gateMat.emissiveIntensity = 0.2 + approve * 1.6
    approvedMat.opacity = win(s, 0.86, 0.98)
    fragMat.emissiveIntensity = 1.1 + approve * 0.3
  })

  return (
    <group>
      {/* review desk facing the back wall */}
      <Desk position={[0.34, FLOOR, -0.46]} rotationY={Math.PI} w={0.2} d={0.09} />
      <Monitor position={[0.34, DESK_TOP, -0.505]} rotationY={0} kind="draft" w={0.085} h={0.055} />
      <Chair position={[0.34, FLOOR, -0.38]} rotationY={Math.PI + 0.25} task />

      {/* reference shelf, task lamp, and a mug: the physician's own room */}
      <Shelf position={[0.525, FLOOR, -0.34]} rotationY={-Math.PI / 2} levels={3} w={0.16} />
      <DeskLamp position={[0.425, DESK_TOP + 0.003, -0.485]} rotationY={-2.2} />
      <Mug position={[0.265, DESK_TOP + 0.003, -0.435]} />

      {/* four engraved soap regions on the desk */}
      {[
        [0.295, -0.425],
        [0.385, -0.425],
        [0.295, -0.475],
        [0.385, -0.475],
      ].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, DESK_TOP + 0.001, z]} material={mats.furniture}>
            <boxGeometry args={[0.052, 0.0015, 0.036]} />
          </mesh>
          <mesh position={[x, DESK_TOP + 0.0025, z + 0.023]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.05, 0.0125]} />
            <meshBasicMaterial map={soapTextures[i]} transparent depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* clinical fragments arriving from the exam room */}
      <instancedMesh
        ref={fragmentsRef}
        args={[undefined, undefined, N_FRAGMENTS]}
        material={fragMat}
      >
        <boxGeometry args={[0.009, 0.003, 0.007]} />
      </instancedMesh>

      {/* the approval gate: a thin bar on the desk edge, no ceremony */}
      <mesh position={[0.34, DESK_TOP + 0.003, -0.408]} material={mats.bezel}>
        <boxGeometry args={[0.1, 0.0022, 0.005]} />
      </mesh>
      <mesh ref={approvalRef} position={[0.34, DESK_TOP + 0.0042, -0.408]} material={gateMat}>
        <boxGeometry args={[0.1, 0.002, 0.0042]} />
      </mesh>
      <mesh position={[0.34, DESK_TOP + 0.028, -0.406]}>
        <planeGeometry args={[0.11, 0.0165]} />
        <primitive object={approvedMat} attach="material" />
      </mesh>

      {/* exit gate to the follow-through room */}
      <group position={[0.145, 0, -0.21]}>
        {[-0.09, 0.09].map((z) => (
          <mesh key={z} position={[0, FLOOR + 0.11, z]} material={mats.structure}>
            <boxGeometry args={[0.012, 0.22, 0.012]} />
          </mesh>
        ))}
        <mesh position={[0, FLOOR + 0.225, 0]} material={mats.structure}>
          <boxGeometry args={[0.012, 0.012, 0.19]} />
        </mesh>
        <mesh position={[0, FLOOR + 0.217, 0]} material={gateMat}>
          <boxGeometry args={[0.006, 0.003, 0.17]} />
        </mesh>
      </group>
    </group>
  )
}
