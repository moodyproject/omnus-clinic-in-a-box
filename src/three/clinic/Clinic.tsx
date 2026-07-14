import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials, PALETTE } from '../materials'
import { CLINIC } from '../constants'
import { smoothedState, sceneT, swin, shellOpen } from '../../scroll/journey'
import { makeLabelTexture, useFontsReady } from '../textures'
import { Reception } from './Reception'
import { ExamRoom } from './ExamRoom'
import { ReviewStation } from './ReviewStation'
import { FollowThrough } from './FollowThrough'
import { OpsLayer } from './OpsLayer'
import { People } from './people/People'
import type { Quality } from '../../hooks/useMediaFlags'

const T = 0.016
const FLOOR = CLINIC.floorY

/** one interior partition or perimeter wall, with a slim graphite cap trim */
function Wall({
  a,
  b,
  h = CLINIC.wallH,
}: {
  a: [number, number]
  b: [number, number]
  h?: number
}) {
  const mats = getMaterials()
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const cx = (a[0] + b[0]) / 2
  const cz = (a[1] + b[1]) / 2
  const horizontal = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1])
  const size: [number, number, number] = horizontal ? [len, h, T] : [T, h, len]
  return (
    <group>
      <mesh position={[cx, FLOOR + h / 2, cz]} material={mats.wall}>
        <boxGeometry args={size} />
      </mesh>
      <mesh position={[cx, FLOOR + h + 0.0025, cz]} material={mats.structure}>
        <boxGeometry
          args={horizontal ? [len + 0.003, 0.005, T + 0.005] : [T + 0.005, 0.005, len + 0.003]}
        />
      </mesh>
      {/* baseboard skirting on both faces */}
      <mesh position={[cx, FLOOR + 0.007, cz]} material={mats.structure}>
        <boxGeometry
          args={horizontal ? [len + 0.002, 0.014, T + 0.004] : [T + 0.004, 0.014, len + 0.002]}
        />
      </mesh>
    </group>
  )
}

/** an ajar door leaf on a wall gap: real circulation, recently used */
function DoorLeaf({
  position,
  leafZ,
  swing,
}: {
  position: [number, number]
  /** direction the closed leaf extends along z from the hinge */
  leafZ: 1 | -1
  /** opening rotation around the hinge */
  swing: number
}) {
  const mats = getMaterials()
  return (
    <group position={[position[0], FLOOR, position[1]]} rotation-y={swing}>
      <mesh position={[0, 0.12, leafZ * 0.05]} material={mats.wall}>
        <boxGeometry args={[0.013, 0.24, 0.098]} />
      </mesh>
      <mesh position={[0, 0.2425, leafZ * 0.05]} material={mats.structure}>
        <boxGeometry args={[0.015, 0.004, 0.102]} />
      </mesh>
      {/* handle */}
      <mesh position={[0.009, 0.13, leafZ * 0.086]} material={mats.bezel}>
        <boxGeometry args={[0.005, 0.005, 0.014]} />
      </mesh>
    </group>
  )
}

function FloorLabel({
  text,
  position,
  width = 0.11,
  color,
}: {
  text: string
  position: [number, number]
  width?: number
  color?: string
}) {
  const fontsReady = useFontsReady()
  const texture = useMemo(
    () => makeLabelTexture(text, { color: color ?? 'rgba(17, 19, 21, 0.52)', size: 46 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, color, fontsReady],
  )
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={[position[0], FLOOR + 0.0035, position[1]]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[width, width / 4]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} opacity={0.9} />
    </mesh>
  )
}

/**
 * the whole miniature clinic that lives on the appliance chassis: a porcelain
 * floor field over the dark slab, cross circulation with real door openings,
 * four rooms, and the ceramic operating core at the center.
 */
export function Clinic({ quality }: { quality: Quality }) {
  const mats = getMaterials()
  const groupRef = useRef<THREE.Group>(null)
  const warmLight = useRef<THREE.PointLight>(null)
  const coolLight = useRef<THREE.PointLight>(null)
  const detailed = quality.tier === 'high'

  const coreMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.sage,
        emissive: PALETTE.sage,
        emissiveIntensity: 0.5,
      }),
    [],
  )
  useEffect(() => () => coreMat.dispose(), [coreMat])

  useFrame(() => {
    const p = smoothedState.p
    const open = shellOpen(p)
    if (groupRef.current) {
      const visible = open > 0.015
      if (groupRef.current.visible !== visible) groupRef.current.visible = visible
    }
    if (warmLight.current) warmLight.current.intensity = 0.42 * open
    if (coolLight.current) coolLight.current.intensity = 0.32 * open

    // the core's status light lifts quietly while the clinic settles into
    // rhythm during operations; a restrained indicator, not a network
    const opsK = swin(sceneT(p, 'ops'), 0.3, 0.85)
    coreMat.emissiveIntensity = 0.45 + opsK * 0.5
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* interior light, fades in as the sleeve lifts */}
      <pointLight ref={warmLight} position={[0, 0.62, 0.28]} color="#fff6e8" distance={2.2} decay={1.8} intensity={0} />
      <pointLight ref={coolLight} position={[0, 1.05, -0.15]} color="#f4f2ec" distance={2.4} decay={1.8} intensity={0} />

      {/* porcelain floor field on the dark chassis slab, plus circulation */}
      <mesh position={[0, FLOOR - 0.004, 0]} material={mats.floor}>
        <boxGeometry args={[1.14, 0.008, 1.14]} />
      </mesh>
      <mesh position={[0, FLOOR + 0.0015, 0.35]} material={mats.corridor}>
        <boxGeometry args={[0.26, 0.004, 0.44]} />
      </mesh>
      <mesh position={[0, FLOOR + 0.0015, 0]} material={mats.corridor}>
        <boxGeometry args={[1.14, 0.004, 0.24]} />
      </mesh>

      {/* room flooring: restrained differences per room */}
      <mesh position={[-0.46, FLOOR + 0.0012, 0.37]} material={mats.rug}>
        <cylinderGeometry args={[0.095, 0.095, 0.0022, 28]} />
      </mesh>
      <mesh position={[0.34, FLOOR + 0.0012, -0.42]} material={mats.rug}>
        <boxGeometry args={[0.26, 0.0022, 0.2]} />
      </mesh>
      <mesh position={[-0.37, FLOOR + 0.0012, -0.46]} material={mats.rug}>
        <boxGeometry args={[0.34, 0.0022, 0.12]} />
      </mesh>
      {/* exam zone demarcation: a fine graphite border */}
      {[
        { pos: [0.345, 0.135] as const, size: [0.37, 0.0018, 0.005] as const },
        { pos: [0.345, 0.525] as const, size: [0.37, 0.0018, 0.005] as const },
        { pos: [0.16, 0.33] as const, size: [0.005, 0.0018, 0.39] as const },
        { pos: [0.53, 0.33] as const, size: [0.005, 0.0018, 0.39] as const },
      ].map((line, i) => (
        <mesh
          key={i}
          position={[line.pos[0], FLOOR + 0.0014, line.pos[1]]}
          material={mats.structure}
        >
          <boxGeometry args={line.size as unknown as [number, number, number]} />
        </mesh>
      ))}

      {/* entrance threshold plate on the chassis apron */}
      <mesh position={[0, FLOOR + 0.004, 0.585]} material={mats.structure}>
        <boxGeometry args={[0.3, 0.008, 0.024]} />
      </mesh>

      {/* perimeter walls (the entrance stays open toward the bus bar) */}
      <Wall a={[-0.57, -0.562]} b={[0.57, -0.562]} />
      <Wall a={[-0.562, -0.57]} b={[-0.562, 0.57]} />
      <Wall a={[0.562, -0.57]} b={[0.562, 0.57]} />
      <Wall a={[-0.57, 0.562]} b={[-0.2, 0.562]} />
      <Wall a={[0.2, 0.562]} b={[0.57, 0.562]} />

      {/* room partitions with door gaps onto the cross corridor */}
      <Wall a={[-0.14, 0.3]} b={[-0.14, 0.55]} />
      <Wall a={[-0.55, 0.13]} b={[-0.3, 0.13]} />
      <Wall a={[0.14, 0.3]} b={[0.14, 0.55]} />
      <Wall a={[0.3, 0.13]} b={[0.55, 0.13]} />
      <Wall a={[0.14, -0.55]} b={[0.14, -0.3]} />
      <Wall a={[0.3, -0.13]} b={[0.55, -0.13]} />
      <Wall a={[-0.14, -0.55]} b={[-0.14, -0.3]} />
      <Wall a={[-0.55, -0.13]} b={[-0.3, -0.13]} />

      {/* ajar door leaves at the four room openings */}
      <DoorLeaf position={[-0.14, 0.3]} leafZ={-1} swing={0.8} />
      <DoorLeaf position={[0.14, 0.3]} leafZ={-1} swing={-0.8} />
      <DoorLeaf position={[0.14, -0.3]} leafZ={1} swing={0.8} />
      <DoorLeaf position={[-0.14, -0.3]} leafZ={1} swing={-0.8} />

      {/* the central intelligence core: a ceramic instrument, not a monolith */}
      <group position={[CLINIC.core.x, 0, CLINIC.core.z]}>
        <mesh position={[0, FLOOR + 0.016, 0]} material={mats.structure}>
          <cylinderGeometry args={[0.028, 0.032, 0.032, 20]} />
        </mesh>
        <mesh position={[0, FLOOR + 0.17, 0]} material={mats.furniture}>
          <cylinderGeometry args={[0.019, 0.024, 0.3, 20]} />
        </mesh>
        <mesh position={[0, FLOOR + 0.345, 0]} material={mats.structure}>
          <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
        </mesh>
        <mesh position={[0, FLOOR + 0.325, 0]} material={coreMat}>
          <cylinderGeometry args={[0.015, 0.015, 0.01, 20]} />
        </mesh>
        {[FLOOR + 0.11, FLOOR + 0.21].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation-x={-Math.PI / 2} material={coreMat}>
            <torusGeometry args={[0.023, 0.0016, 6, 32]} />
          </mesh>
        ))}
      </group>

      {/* engraved zone names on the floor, like an architectural drawing */}
      <FloorLabel text="intake" position={[-0.34, 0.2]} />
      <FloorLabel text="exam" position={[0.34, 0.2]} />
      <FloorLabel text="review" position={[0.34, -0.2]} />
      <FloorLabel text="follow-through" position={[-0.34, -0.2]} width={0.14} />
      <FloorLabel text="scheduling" position={[-0.42, -0.075]} width={0.085} />
      <FloorLabel text="inbox" position={[0.42, -0.075]} width={0.085} />
      <FloorLabel text="coding · billing" position={[0.2, -0.115]} width={0.085} />
      <FloorLabel text="reports" position={[-0.2, -0.115]} width={0.085} />

      {/* the rooms */}
      <Reception detailed={detailed} />
      <ExamRoom detailed={detailed} />
      <ReviewStation />
      <FollowThrough detailed={detailed} />
      <OpsLayer detailed={detailed} />

      {/* the people who inhabit the clinic */}
      <People />
    </group>
  )
}
