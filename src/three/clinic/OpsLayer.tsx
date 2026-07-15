import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials } from '../materials'
import { CLINIC } from '../constants'
import { mulberry32 } from '../../lib/rng'
import { smoothedState, sceneT, swin } from '../../scroll/journey'
import { makeInboxStageTexture, makeLabelTexture, useFontsReady } from '../textures'
import { OpsConsole, ShadowOval } from './props'

const FLOOR = CLINIC.floorY

const dummy = new THREE.Object3D()

/**
 * scene 7: the work behind the care. four built-in consoles share one
 * cabinetry language across the corridor: scheduling at the west end, the
 * clinic inbox at the east end, coding·billing and follow-up flanking the
 * core. each carries a small queue of task cards, settled into flush stacks.
 * complexity becoming calm; no routing lines.
 */
export function OpsLayer({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const fontsReady = useFontsReady()
  const cardsRef = useRef<THREE.InstancedMesh>(null)

  // the inbox screen crossfades from a loaded queue to a calm one
  const inboxStages = useMemo(
    () => [makeInboxStageTexture(0), makeInboxStageTexture(1)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fontsReady],
  )
  const inboxMats = useMemo(
    () =>
      inboxStages.map(
        (texture, i) =>
          new THREE.MeshBasicMaterial({
            map: texture,
            toneMapped: false,
            transparent: i > 0,
            opacity: i === 0 ? 1 : 0,
            depthWrite: i === 0,
          }),
      ),
    [inboxStages],
  )
  const inboxLabel = useMemo(
    () => makeLabelTexture('inbox', { color: 'rgba(17, 19, 21, 0.58)', size: 44 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fontsReady],
  )
  useEffect(
    () => () => {
      inboxStages.forEach((t) => t.dispose())
      inboxMats.forEach((m) => m.dispose())
      inboxLabel.dispose()
    },
    [inboxStages, inboxMats, inboxLabel],
  )

  const layout = useMemo(() => {
    const rand = mulberry32(303)
    const stacks: { x: number; z: number; n: number; r: number }[] = [
      // scheduling console, west end
      { x: -0.531, z: -0.031, n: 3, r: Math.PI / 2 },
      { x: -0.531, z: 0.031, n: 3, r: Math.PI / 2 },
      // inbox console, east end
      { x: 0.531, z: -0.031, n: 3, r: Math.PI / 2 },
      { x: 0.531, z: 0.031, n: 3, r: Math.PI / 2 },
      // coding · billing beside the core
      { x: 0.168, z: -0.088, n: 3, r: 0 },
      { x: 0.232, z: -0.088, n: 2, r: 0 },
      // follow-up, mirrored
      { x: -0.168, z: -0.088, n: 3, r: 0 },
      { x: -0.232, z: -0.088, n: 2, r: 0 },
    ]
    const cards: { p: [number, number, number]; r: number }[] = []
    for (const stack of stacks) {
      for (let i = 0; i < stack.n; i++) {
        cards.push({
          p: [stack.x, FLOOR + 0.0955 + i * 0.002, stack.z],
          r: stack.r + (rand() - 0.5) * 0.1,
        })
      }
    }
    return cards
  }, [])

  useEffect(() => {
    const mesh = cardsRef.current
    if (!mesh) return
    for (let i = 0; i < layout.length; i++) {
      const card = layout[i]
      dummy.position.set(...card.p)
      dummy.rotation.set(0, card.r, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [layout])

  useFrame(() => {
    const s = sceneT(smoothedState.p, 'ops')
    // fixed screens may change interface state; no physical object moves
    inboxMats[1].opacity = swin(s, 0.55, 0.9)
  })

  return (
    <group>
      {/* scheduling console at the west end of the cross corridor */}
      <OpsConsole
        position={[-0.522, FLOOR, 0]}
        rotationY={Math.PI / 2}
        kind="schedule"
        label="scheduling"
        w={0.12}
      />

      {/* inbox console at the east end: its queue calms as it is worked */}
      <group position={[0.522, FLOOR, 0]} rotation-y={-Math.PI / 2}>
        <ShadowOval w={0.17} d={0.1} opacity={0.26} />
        <mesh position={[0, 0.01, -0.003]} material={mats.structure}>
          <boxGeometry args={[0.106, 0.02, 0.05]} />
        </mesh>
        <mesh position={[0, 0.055, 0]} material={mats.cabinet}>
          <boxGeometry args={[0.12, 0.066, 0.058]} />
        </mesh>
        <mesh position={[0, 0.0905, 0]} material={mats.counterTop}>
          <boxGeometry args={[0.126, 0.005, 0.064]} />
        </mesh>
        {[-0.03, 0.03].map((x) => (
          <mesh key={x} position={[x, 0.055, 0.0295]} material={mats.bezel}>
            <boxGeometry args={[0.0014, 0.052, 0.001]} />
          </mesh>
        ))}
        <group position={[0, 0.108, -0.008]} rotation-x={-0.28}>
          <mesh material={mats.bezel}>
            <boxGeometry args={[0.062, 0.042, 0.004]} />
          </mesh>
          {inboxMats.map((mat, i) => (
            <mesh key={i} position={[0, 0, 0.0022 + i * 0.0004]} material={mat}>
              <planeGeometry args={[0.057, 0.037]} />
            </mesh>
          ))}
        </group>
        <mesh position={[0, 0.0785, 0.0325]} rotation-x={-0.5}>
          <planeGeometry args={[0.052, 0.013]} />
          <meshBasicMaterial map={inboxLabel} transparent depthWrite={false} />
        </mesh>
      </group>

      {/* coding · billing and follow-up consoles flank the core, backed
          against the corridor walls so the cross stays architect-designed */}
      <OpsConsole
        position={[0.2, FLOOR, -0.1]}
        rotationY={0}
        kind="inbox"
        label="coding · billing"
        w={0.11}
      />
      <OpsConsole
        position={[-0.2, FLOOR, -0.1]}
        rotationY={0}
        kind="schedule"
        label="follow-up"
        w={0.11}
      />

      {/* quiet corridor detail: a bench outside reception for the entrance
          approach, aligned against the room wall */}
      {detailed && (
        <group position={[-0.1275, FLOOR, 0.47]} rotation-y={Math.PI / 2}>
          <ShadowOval w={0.1} d={0.05} opacity={0.2} />
          <mesh position={[0, 0.036, 0]} material={mats.oak}>
            <boxGeometry args={[0.075, 0.007, 0.025]} />
          </mesh>
          {[-0.03, 0.03].map((x) => (
            <mesh key={x} position={[x, 0.017, 0]} material={mats.frame}>
              <boxGeometry args={[0.005, 0.034, 0.02]} />
            </mesh>
          ))}
        </group>
      )}

      {/* fixed, orderly task stacks across all four stations */}
      <instancedMesh
        ref={cardsRef}
        args={[undefined, undefined, layout.length]}
        material={mats.paper}
      >
        <boxGeometry args={[0.028, 0.0018, 0.038]} />
      </instancedMesh>
    </group>
  )
}
