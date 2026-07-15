import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials, PALETTE } from '../materials'
import { CLINIC } from '../constants'
import { smoothedState, sceneT, swin, shellOpen } from '../../scroll/journey'
import { makeFloorAOTexture, makeLabelTexture, useFontsReady } from '../textures'
import { Reception } from './Reception'
import { ExamRoom } from './ExamRoom'
import { ReviewStation } from './ReviewStation'
import { FollowThrough } from './FollowThrough'
import { OpsLayer } from './OpsLayer'
import { People } from './people/People'
import type { Quality } from '../../hooks/useMediaFlags'

const T = 0.022
const FLOOR = CLINIC.floorY

/** one joined architectural wall with warm cap trim and a recessed skirting line */
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
      <mesh position={[cx, FLOOR + h / 2, cz]} material={mats.wall} receiveShadow>
        <boxGeometry args={size} />
      </mesh>
      <mesh position={[cx, FLOOR + h + 0.002, cz]} material={mats.wallTrim}>
        <boxGeometry
          args={horizontal ? [len + 0.002, 0.004, T + 0.002] : [T + 0.002, 0.004, len + 0.002]}
        />
      </mesh>
      <mesh position={[cx, FLOOR + 0.006, cz]} material={mats.wallTrim}>
        <boxGeometry
          args={horizontal ? [len + 0.002, 0.012, T + 0.003] : [T + 0.003, 0.012, len + 0.002]}
        />
      </mesh>
    </group>
  )
}

/**
 * a complete doorway assembly: jambs, lintel, threshold, and a pale-wood
 * leaf parked open against the room-side partition, with hinge barrels and
 * a handle. leaves are fixed: this clinic's doors are pinned open for
 * circulation, which is exactly how working clinics run.
 */
function Doorway({
  x,
  z,
  swing,
  hinge = 'near',
}: {
  /** wall plane x */
  x: number
  /** gap center z */
  z: number
  /** parked-open rotation of the leaf around its hinge */
  swing: number
  /** which jamb carries the hinge: near = toward the cross corridor */
  hinge?: 'near' | 'far'
}) {
  const mats = getMaterials()
  const h = 0.212
  const near = z > 0 ? z - 0.055 : z + 0.055
  const far = z > 0 ? z + 0.055 : z - 0.055
  const hingeZ = hinge === 'near' ? near : far
  return (
    <group>
      {/* jambs + lintel */}
      {[-0.055, 0.055].map((dz) => (
        <mesh key={dz} position={[x, FLOOR + h / 2, z + dz]} material={mats.wallTrim}>
          <boxGeometry args={[T + 0.008, h, 0.011]} />
        </mesh>
      ))}
      <mesh position={[x, FLOOR + h, z]} material={mats.wallTrim}>
        <boxGeometry args={[T + 0.008, 0.013, 0.121]} />
      </mesh>
      {/* threshold strip across the opening */}
      <mesh position={[x, FLOOR + 0.0016, z]} material={mats.steel}>
        <boxGeometry args={[T + 0.012, 0.0032, 0.106]} />
      </mesh>
      {/* the leaf, parked open against the room-side wall */}
      <group position={[x, FLOOR, hingeZ]} rotation-y={swing}>
        {/* hinge barrels */}
        {[0.05, 0.115, 0.18].map((y) => (
          <mesh key={y} position={[0, y, 0]} material={mats.steel}>
            <cylinderGeometry args={[0.0022, 0.0022, 0.016, 6]} />
          </mesh>
        ))}
        <mesh position={[0, 0.102, 0.053]} material={mats.woodDoor} castShadow>
          <boxGeometry args={[0.011, 0.202, 0.102]} />
        </mesh>
        {/* handle on the corridor-facing side, near the free edge */}
        <mesh position={[0.0075, 0.105, 0.092]} material={mats.steel}>
          <boxGeometry args={[0.004, 0.0035, 0.016]} />
        </mesh>
        {/* kick plate */}
        <mesh position={[0.006, 0.02, 0.053]} material={mats.steel}>
          <boxGeometry args={[0.0008, 0.03, 0.096]} />
        </mesh>
      </group>
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

/** soft edge-darkening plane laid over a room floor: cheap depth */
function FloorAO({
  position,
  size,
  opacity = 1,
}: {
  position: [number, number]
  size: [number, number]
  opacity?: number
}) {
  const texture = useMemo(() => makeFloorAOTexture(), [])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={[position[0], FLOOR + 0.0026, position[1]]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} />
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
  const frontLight = useRef<THREE.PointLight>(null)
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
    if (warmLight.current) warmLight.current.intensity = 0.5 * open
    if (coolLight.current) coolLight.current.intensity = 0.3 * open
    if (frontLight.current) frontLight.current.intensity = 0.34 * open

    // the core's status light lifts quietly while the clinic settles into
    // rhythm during operations; a restrained indicator, not a network
    const opsK = swin(sceneT(p, 'ops'), 0.3, 0.85)
    coreMat.emissiveIntensity = 0.45 + opsK * 0.5
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* interior light, fades in as the sleeve lifts: warm key over the
          front rooms, cooler fill over the back, a quiet warm front kicker */}
      <pointLight ref={warmLight} position={[0.15, 0.66, 0.34]} color="#ffedd6" distance={2.1} decay={1.7} intensity={0} />
      <pointLight ref={coolLight} position={[-0.1, 1.05, -0.3]} color="#eef0ee" distance={2.4} decay={1.8} intensity={0} />
      <pointLight ref={frontLight} position={[-0.35, 0.5, 0.5]} color="#ffe9cf" distance={1.6} decay={1.9} intensity={0} />

      {/* one continuous architectural floor slab with four restrained room finishes */}
      <mesh position={[0, FLOOR - 0.004, 0]} material={mats.floor} receiveShadow>
        <boxGeometry args={[1.14, 0.008, 1.14]} />
      </mesh>
      <mesh position={[-0.351, FLOOR + 0.0012, 0.351]} material={mats.roomWarm}>
        <boxGeometry args={[0.405, 0.0024, 0.405]} />
      </mesh>
      <mesh position={[0.351, FLOOR + 0.0012, 0.351]} material={mats.roomWarm}>
        <boxGeometry args={[0.405, 0.0024, 0.405]} />
      </mesh>
      <mesh position={[0.351, FLOOR + 0.0012, -0.351]} material={mats.roomMineral}>
        <boxGeometry args={[0.405, 0.0024, 0.405]} />
      </mesh>
      <mesh position={[-0.351, FLOOR + 0.0012, -0.351]} material={mats.roomMineral}>
        <boxGeometry args={[0.405, 0.0024, 0.405]} />
      </mesh>

      {/* terrazzo cross corridor with graphite edge reveals */}
      <mesh position={[0, FLOOR + 0.0016, 0]} material={mats.corridor}>
        <boxGeometry args={[1.124, 0.0032, 0.23]} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, FLOOR + 0.0016, s * 0.3405]} material={mats.corridor}>
          <boxGeometry args={[0.23, 0.0032, 0.451]} />
        </mesh>
      ))}
      {/* corridor edge hairlines */}
      {[0.1175, -0.1175].map((o) => (
        <group key={o}>
          <mesh position={[0, FLOOR + 0.0032, o]} material={mats.structure}>
            <boxGeometry args={[1.124, 0.0012, 0.0035]} />
          </mesh>
          <mesh position={[o, FLOOR + 0.0032, 0.3405]} material={mats.structure}>
            <boxGeometry args={[0.0035, 0.0012, 0.451]} />
          </mesh>
          <mesh position={[o, FLOOR + 0.0032, -0.3405]} material={mats.structure}>
            <boxGeometry args={[0.0035, 0.0012, 0.451]} />
          </mesh>
        </group>
      ))}

      {/* room-floor ambient occlusion: soft edge shading grounds the walls */}
      <FloorAO position={[-0.351, 0.351]} size={[0.42, 0.42]} />
      <FloorAO position={[0.351, 0.351]} size={[0.42, 0.42]} />
      <FloorAO position={[0.351, -0.351]} size={[0.42, 0.42]} />
      <FloorAO position={[-0.351, -0.351]} size={[0.42, 0.42]} />
      <FloorAO position={[0, 0]} size={[0.3, 0.3]} opacity={0.5} />

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

      {/* four fully bounded rooms around a continuous cross corridor */}
      <Wall a={[-0.14, 0.14]} b={[-0.14, 0.245]} />
      <Wall a={[-0.14, 0.355]} b={[-0.14, 0.562]} />
      <Wall a={[0.14, 0.14]} b={[0.14, 0.245]} />
      <Wall a={[0.14, 0.355]} b={[0.14, 0.562]} />
      <Wall a={[-0.562, 0.14]} b={[-0.14, 0.14]} />
      <Wall a={[0.14, 0.14]} b={[0.562, 0.14]} />
      <Wall a={[-0.14, -0.562]} b={[-0.14, -0.355]} />
      <Wall a={[-0.14, -0.245]} b={[-0.14, -0.14]} />
      <Wall a={[0.14, -0.562]} b={[0.14, -0.355]} />
      <Wall a={[0.14, -0.245]} b={[0.14, -0.14]} />
      <Wall a={[-0.562, -0.14]} b={[-0.14, -0.14]} />
      <Wall a={[0.14, -0.14]} b={[0.562, -0.14]} />

      {/* doorways: every leaf parks open against its room-side partition,
          hinged nearest the cross corridor, so circulation reads immediately */}
      <Doorway x={-0.14} z={0.3} swing={-0.16} hinge="far" />
      <Doorway x={0.14} z={0.3} swing={Math.PI - 0.16} />
      <Doorway x={0.14} z={-0.3} swing={0.16} />
      <Doorway x={-0.14} z={-0.3} swing={-0.16} />

      {/* the central intelligence core: a ceramic instrument on a graphite
          plinth, with a circular inlay marking its service zone */}
      <group position={[CLINIC.core.x, 0, CLINIC.core.z]}>
        <mesh position={[0, FLOOR + 0.0034, 0]} rotation-x={-Math.PI / 2} material={mats.structure}>
          <ringGeometry args={[0.062, 0.066, 40]} />
        </mesh>
        <mesh position={[0, FLOOR + 0.011, 0]} material={mats.structure}>
          <cylinderGeometry args={[0.03, 0.034, 0.022, 24]} />
        </mesh>
        <mesh position={[0, FLOOR + 0.112, 0]} material={mats.furniture} castShadow>
          <cylinderGeometry args={[0.019, 0.0235, 0.18, 24]} />
        </mesh>
        {/* machined reveal + graphite crown */}
        <mesh position={[0, FLOOR + 0.056, 0]} material={mats.structure}>
          <cylinderGeometry args={[0.0222, 0.0224, 0.004, 24]} />
        </mesh>
        <mesh position={[0, FLOOR + 0.199, 0]} material={mats.structure}>
          <cylinderGeometry args={[0.0192, 0.019, 0.008, 24]} />
        </mesh>
        {/* recessed front status slot facing the entrance */}
        <mesh position={[0, FLOOR + 0.125, 0.0209]} material={mats.bezel}>
          <boxGeometry args={[0.004, 0.042, 0.0016]} />
        </mesh>
        <mesh position={[0, FLOOR + 0.112, 0.0216]} material={coreMat}>
          <boxGeometry args={[0.0024, 0.012, 0.001]} />
        </mesh>
        <mesh position={[0, FLOOR + 0.227, 0]} material={mats.structure}>
          <cylinderGeometry args={[0.005, 0.005, 0.032, 8]} />
        </mesh>
        <mesh position={[0, FLOOR + 0.207, 0]} material={coreMat}>
          <cylinderGeometry args={[0.0155, 0.0155, 0.009, 24]} />
        </mesh>
        {[FLOOR + 0.085, FLOOR + 0.155].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation-x={-Math.PI / 2} material={coreMat}>
            <torusGeometry args={[0.0215, 0.0014, 6, 32]} />
          </mesh>
        ))}
      </group>

      {/* engraved zone names on the floor, like an architectural drawing */}
      <FloorLabel text="intake" position={[-0.34, 0.2]} />
      <FloorLabel text="exam" position={[0.34, 0.2]} />
      <FloorLabel text="review" position={[0.34, -0.2]} />
      <FloorLabel text="follow-through" position={[-0.34, -0.2]} width={0.14} />

      {/* the rooms */}
      <Reception detailed={detailed} />
      <ExamRoom detailed={detailed} />
      <ReviewStation detailed={detailed} />
      <FollowThrough detailed={detailed} />
      <OpsLayer detailed={detailed} />

      {/* the people who inhabit the clinic */}
      <People />
    </group>
  )
}
