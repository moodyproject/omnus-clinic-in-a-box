import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials } from '../materials'
import { CLINIC } from '../constants'
import { mulberry32 } from '../../lib/rng'
import { lerp } from '../../lib/math'
import { smoothedState, sceneT, swin } from '../../scroll/journey'
import { makeInboxStageTexture, useFontsReady } from '../textures'
import { ShadowOval } from './props'

const FLOOR = CLINIC.floorY

const dummy = new THREE.Object3D()

interface CardPose {
  from: [number, number, number]
  fromR: [number, number, number]
  to: [number, number, number]
}

interface Station {
  /** where the pending work sits, slightly disordered */
  pending: (rand: () => number, i: number) => CardPose
  count: number
  /** when this station resolves inside the ops window */
  window: [number, number]
}

/**
 * scene 7: the work behind the care. four stations each carry a small queue
 * of task cards that begin in restrained disorder and settle into flush,
 * finished stacks as the scene progresses, while the people move between
 * stations. complexity becoming calm; no routing lines.
 */
export function OpsLayer({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const fontsReady = useFontsReady()
  const cardsRef = useRef<THREE.InstancedMesh>(null)

  // the two ops screens crossfade from a loaded queue to a calm one
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
  useEffect(
    () => () => {
      inboxStages.forEach((t) => t.dispose())
      inboxMats.forEach((m) => m.dispose())
    },
    [inboxStages, inboxMats],
  )

  const layout = useMemo(() => {
    const rand = mulberry32(303)
    const stations: Station[] = [
      {
        // scheduling rack, west: uneven cards across two shelves -> flush row
        count: 6,
        window: [0.15, 0.55],
        pending: (r, i) => ({
          from: [
            -0.532 + r() * 0.02,
            FLOOR + (i % 2 === 0 ? 0.0555 : 0.1055) + r() * 0.004,
            -0.06 + r() * 0.12,
          ],
          fromR: [0, r() * 0.9 - 0.45, 0],
          to: [-0.525, FLOOR + 0.0555 + (i % 2) * 0.05, -0.045 + Math.floor(i / 2) * 0.045],
        }),
      },
      {
        // inbox nook, east: loose sheets -> a squared stack beside the screen
        count: 6,
        window: [0.3, 0.7],
        pending: (r, i) => ({
          from: [0.495 + r() * 0.04, FLOOR + 0.095 + r() * 0.01, -0.045 + r() * 0.12],
          fromR: [0, r() * 1.4 - 0.7, 0],
          to: [0.5, FLOOR + 0.0955 + i * 0.0022, -0.045],
        }),
      },
      {
        // coding & billing console by the core
        count: 5,
        window: [0.45, 0.85],
        pending: (r, i) => ({
          from: [0.17 + r() * 0.05, FLOOR + 0.0595 + r() * 0.004, -0.088 + r() * 0.045],
          fromR: [0, r() * 1.2 - 0.6, 0],
          to: [0.2, FLOOR + 0.0595 + i * 0.0022, -0.065],
        }),
      },
      {
        // reports console, mirrored
        count: 5,
        window: [0.55, 0.92],
        pending: (r, i) => ({
          from: [-0.23 + r() * 0.05, FLOOR + 0.0595 + r() * 0.004, -0.088 + r() * 0.045],
          fromR: [0, r() * 1.2 - 0.6, 0],
          to: [-0.2, FLOOR + 0.0595 + i * 0.0022, -0.065],
        }),
      },
    ]
    const cards: (CardPose & { window: [number, number]; stagger: number })[] = []
    for (const station of stations) {
      for (let i = 0; i < station.count; i++) {
        cards.push({
          ...station.pending(rand, i),
          window: station.window,
          stagger: i / station.count,
        })
      }
    }
    return cards
  }, [])

  useFrame(() => {
    const s = sceneT(smoothedState.p, 'ops')
    const mesh = cardsRef.current
    if (mesh) {
      // the task queues belong to the overhead scene: before it begins the
      // clinic reads clean, and the work "arrives" as the camera rises
      const cardsVisible = s > 0.015
      if (mesh.visible !== cardsVisible) mesh.visible = cardsVisible
      for (let i = 0; i < layout.length; i++) {
        const card = layout[i]
        const [a, b] = card.window
        const local = swin(s, a, b)
        const ti = Math.min(1, Math.max(0, local * 1.5 - card.stagger * 0.5))
        const e = ti * ti * (3 - 2 * ti)
        dummy.position.set(
          lerp(card.from[0], card.to[0], e),
          lerp(card.from[1], card.to[1], e),
          lerp(card.from[2], card.to[2], e),
        )
        dummy.rotation.set(
          lerp(card.fromR[0], 0, e),
          lerp(card.fromR[1], 0, e),
          lerp(card.fromR[2], 0, e),
        )
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }

    // screens settle once the queues are mostly worked
    inboxMats[1].opacity = swin(s, 0.55, 0.9)
  })

  return (
    <group>
      {/* scheduling rack at the west end of the cross corridor */}
      <group position={[-0.52, FLOOR, 0]}>
        <ShadowOval w={0.11} d={0.2} opacity={0.22} />
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
      </group>

      {/* inbox nook at the east end */}
      <group position={[0.52, FLOOR, 0]}>
        <ShadowOval w={0.1} d={0.18} opacity={0.22} />
        <mesh position={[0, 0.09, 0]} material={mats.deskTop}>
          <boxGeometry args={[0.045, 0.005, 0.14]} />
        </mesh>
        {[-0.06, 0.06].map((z) => (
          <mesh key={z} position={[0, 0.045, z]} material={mats.furniture}>
            <boxGeometry args={[0.04, 0.09, 0.01]} />
          </mesh>
        ))}
      </group>
      {/* nook screen: a loaded queue that calms as it is worked */}
      <group position={[0.52, FLOOR + 0.095, 0.02]} rotation-y={-Math.PI / 2}>
        <mesh position={[0, 0.0465, 0]} material={mats.bezel}>
          <boxGeometry args={[0.07, 0.045, 0.005]} />
        </mesh>
        {inboxMats.map((mat, i) => (
          <mesh key={i} position={[0, 0.0465, 0.0028 + i * 0.0004]} material={mat}>
            <planeGeometry args={[0.064, 0.039]} />
          </mesh>
        ))}
        <mesh position={[0, 0.012, -0.004]} material={mats.structure}>
          <cylinderGeometry args={[0.003, 0.003, 0.024, 8]} />
        </mesh>
      </group>

      {/* coding & reports consoles flanking the core */}
      {[0.2, -0.2].map((x) => (
        <group key={x} position={[x, FLOOR, -0.065]}>
          <ShadowOval w={0.12} d={0.1} opacity={0.2} />
          <mesh position={[0, 0.055, 0]} material={mats.deskTop}>
            <boxGeometry args={[0.09, 0.005, 0.06]} />
          </mesh>
          {[-0.035, 0.035].map((dx) => (
            <mesh key={dx} position={[dx, 0.0275, 0]} material={mats.furniture}>
              <boxGeometry args={[0.012, 0.055, 0.05]} />
            </mesh>
          ))}
          {detailed && (
            <mesh position={[0, 0.0585, -0.022]} material={mats.structure}>
              <boxGeometry args={[0.07, 0.002, 0.008]} />
            </mesh>
          )}
        </group>
      ))}

      {/* the task cards being worked across all four stations */}
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
