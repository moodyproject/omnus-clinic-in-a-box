import { getMaterials } from '../materials'
import { getSharedShadowTexture, useScreenTexture, type ScreenKind } from '../textures'

/**
 * miniature furniture kit. everything is built from the shared material set
 * so the whole clinic reads as one architectural model. approximate scale:
 * 1 world unit = 10m, so a desk is ~0.08 tall.
 */

/** soft shadow oval that grounds a piece of furniture on the floor */
export function ShadowOval({
  w,
  d,
  opacity = 0.28,
}: {
  w: number
  d: number
  opacity?: number
}) {
  return (
    <mesh position={[0, 0.0018, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial
        map={getSharedShadowTexture()}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

export function Chair({
  position,
  rotationY = 0,
  task = false,
}: {
  position: [number, number, number]
  rotationY?: number
  task?: boolean
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={0.075} d={0.075} opacity={0.2} />
      {/* seat */}
      <mesh position={[0, 0.042, 0]} material={task ? mats.deskTop : mats.furniture}>
        <boxGeometry args={[0.044, 0.008, 0.042]} />
      </mesh>
      {/* back */}
      <mesh position={[0, 0.072, -0.019]} material={task ? mats.deskTop : mats.furniture}>
        <boxGeometry args={[0.044, 0.052, 0.007]} />
      </mesh>
      {task ? (
        // pedestal base
        <>
          <mesh position={[0, 0.021, 0]} material={mats.structure}>
            <cylinderGeometry args={[0.004, 0.004, 0.042, 8]} />
          </mesh>
          <mesh position={[0, 0.003, 0]} material={mats.structure}>
            <cylinderGeometry args={[0.02, 0.024, 0.006, 12]} />
          </mesh>
        </>
      ) : (
        [-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh
              key={`${sx}${sz}`}
              position={[sx * 0.017, 0.019, sz * 0.016]}
              material={mats.structure}
            >
              <cylinderGeometry args={[0.0022, 0.0022, 0.038, 6]} />
            </mesh>
          )),
        )
      )}
    </group>
  )
}

export function Desk({
  position,
  rotationY = 0,
  w = 0.16,
  d = 0.07,
  warm = false,
}: {
  position: [number, number, number]
  rotationY?: number
  w?: number
  d?: number
  /** oak work surface instead of the dark one (reception, waiting) */
  warm?: boolean
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={w * 1.5} d={d * 2.2} />
      <mesh position={[0, 0.078, 0]} material={warm ? mats.oak : mats.deskTop}>
        <boxGeometry args={[w, 0.006, d]} />
      </mesh>
      {/* porcelain body panels */}
      <mesh position={[-w / 2 + 0.012, 0.038, 0]} material={mats.furniture}>
        <boxGeometry args={[0.024, 0.074, d - 0.008]} />
      </mesh>
      <mesh position={[w / 2 - 0.012, 0.038, 0]} material={mats.furniture}>
        <boxGeometry args={[0.024, 0.074, d - 0.008]} />
      </mesh>
    </group>
  )
}

export function Monitor({
  position,
  rotationY = 0,
  kind,
  w = 0.075,
  h = 0.048,
}: {
  position: [number, number, number]
  rotationY?: number
  kind: ScreenKind
  w?: number
  h?: number
}) {
  const mats = getMaterials()
  const texture = useScreenTexture(kind)
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, h / 2 + 0.024, 0]} material={mats.bezel}>
        <boxGeometry args={[w, h, 0.005]} />
      </mesh>
      <mesh position={[0, h / 2 + 0.024, 0.0028]}>
        <planeGeometry args={[w - 0.006, h - 0.006]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* stand */}
      <mesh position={[0, 0.012, -0.004]} material={mats.structure}>
        <cylinderGeometry args={[0.003, 0.003, 0.024, 8]} />
      </mesh>
      <mesh position={[0, 0.0015, -0.004]} material={mats.structure}>
        <boxGeometry args={[0.03, 0.003, 0.02]} />
      </mesh>
    </group>
  )
}

export function WallDisplay({
  position,
  rotationY = 0,
  kind,
  w = 0.13,
  h = 0.075,
}: {
  position: [number, number, number]
  rotationY?: number
  kind: ScreenKind
  w?: number
  h?: number
}) {
  const mats = getMaterials()
  const texture = useScreenTexture(kind)
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh material={mats.bezel}>
        <boxGeometry args={[w, h, 0.006]} />
      </mesh>
      <mesh position={[0, 0, 0.0032]}>
        <planeGeometry args={[w - 0.007, h - 0.007]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function ExamTable({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={0.11} d={0.2} />
      {/* padded surface */}
      <mesh position={[0, 0.062, 0]} material={mats.furniture}>
        <boxGeometry args={[0.062, 0.014, 0.15]} />
      </mesh>
      {/* raised head section */}
      <mesh position={[0, 0.075, -0.055]} rotation-x={0.35} material={mats.furniture}>
        <boxGeometry args={[0.06, 0.012, 0.05]} />
      </mesh>
      {/* frame */}
      <mesh position={[0, 0.028, 0]} material={mats.structure}>
        <boxGeometry args={[0.05, 0.055, 0.11]} />
      </mesh>
      {/* paper roll line across the pad */}
      <mesh position={[0, 0.0705, 0.02]} material={mats.paper}>
        <boxGeometry args={[0.058, 0.0015, 0.09]} />
      </mesh>
    </group>
  )
}

export function Cabinet({
  position,
  rotationY = 0,
  openDrawer = false,
}: {
  position: [number, number, number]
  rotationY?: number
  openDrawer?: boolean
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={0.14} d={0.09} />
      <mesh position={[0, 0.045, 0]} material={mats.furniture}>
        <boxGeometry args={[0.09, 0.09, 0.05]} />
      </mesh>
      <mesh position={[0, 0.0925, 0]} material={mats.deskTop}>
        <boxGeometry args={[0.094, 0.005, 0.054]} />
      </mesh>
      {/* drawer seams */}
      {[0.03, 0.058].map((y) => (
        <mesh key={y} position={[0, y, 0.0252]} material={mats.bezel}>
          <boxGeometry args={[0.08, 0.0015, 0.001]} />
        </mesh>
      ))}
      {openDrawer && (
        <mesh position={[0, 0.072, 0.038]} material={mats.furniture}>
          <boxGeometry args={[0.078, 0.018, 0.03]} />
        </mesh>
      )}
    </group>
  )
}

export function Kiosk({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const mats = getMaterials()
  const texture = useScreenTexture('kiosk')
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.045, 0]} material={mats.structure}>
        <cylinderGeometry args={[0.005, 0.008, 0.09, 10]} />
      </mesh>
      <group position={[0, 0.095, 0.004]} rotation-x={-0.35}>
        <mesh material={mats.bezel}>
          <boxGeometry args={[0.042, 0.055, 0.005]} />
        </mesh>
        <mesh position={[0, 0, 0.0028]}>
          <planeGeometry args={[0.037, 0.05]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/** low waiting-area table with a few magazines */
export function SideTable({ position }: { position: [number, number, number] }) {
  const mats = getMaterials()
  return (
    <group position={position}>
      <ShadowOval w={0.09} d={0.09} opacity={0.22} />
      <mesh position={[0, 0.032, 0]} material={mats.oak}>
        <cylinderGeometry args={[0.032, 0.032, 0.006, 16]} />
      </mesh>
      <mesh position={[0, 0.015, 0]} material={mats.structure}>
        <cylinderGeometry args={[0.004, 0.004, 0.03, 8]} />
      </mesh>
      <mesh position={[0.006, 0.0365, 0.004]} rotation-y={0.4} material={mats.paper}>
        <boxGeometry args={[0.024, 0.0015, 0.032]} />
      </mesh>
      <mesh position={[-0.007, 0.038, -0.003]} rotation-y={-0.2} material={mats.paper}>
        <boxGeometry args={[0.024, 0.0015, 0.032]} />
      </mesh>
    </group>
  )
}

/** a lab coat hanging on a wall rail: quiet evidence of people */
export function CoatRail({
  position,
  rotationY = 0,
  coats = 2,
}: {
  position: [number, number, number]
  rotationY?: number
  coats?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.21, 0]} material={mats.structure}>
        <boxGeometry args={[0.1, 0.004, 0.006]} />
      </mesh>
      {Array.from({ length: coats }, (_, i) => (
        <group
          key={i}
          position={[-0.024 + i * 0.045, 0.152, 0.008]}
          rotation-z={i % 2 === 0 ? 0.05 : -0.04}
        >
          {/* shoulders and body, softly offset like hung fabric */}
          <mesh position={[0, 0.045, 0]} material={mats.paper}>
            <boxGeometry args={[0.036, 0.016, 0.012]} />
          </mesh>
          <mesh material={mats.paper}>
            <boxGeometry args={[0.032, 0.085, 0.009]} />
          </mesh>
          <mesh position={[0, 0.02, 0.005]} material={mats.furniture}>
            <boxGeometry args={[0.008, 0.045, 0.002]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** built-in counter run along a wall, with a kick shadow and seam lines */
export function Counter({
  position,
  rotationY = 0,
  w = 0.3,
  basin = false,
  warm = false,
}: {
  position: [number, number, number]
  rotationY?: number
  w?: number
  basin?: boolean
  /** oak worktop instead of the dark one */
  warm?: boolean
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={w * 1.25} d={0.11} opacity={0.24} />
      {/* kick recess */}
      <mesh position={[0, 0.012, -0.004]} material={mats.structure}>
        <boxGeometry args={[w - 0.02, 0.024, 0.048]} />
      </mesh>
      {/* body */}
      <mesh position={[0, 0.048, 0]} material={mats.furniture}>
        <boxGeometry args={[w, 0.05, 0.06]} />
      </mesh>
      {/* top */}
      <mesh position={[0, 0.0765, 0]} material={warm ? mats.oak : mats.deskTop}>
        <boxGeometry args={[w + 0.008, 0.007, 0.066]} />
      </mesh>
      {/* door seams */}
      {[-w / 4, 0, w / 4].map((x) => (
        <mesh key={x} position={[x, 0.048, 0.0305]} material={mats.bezel}>
          <boxGeometry args={[0.0015, 0.044, 0.001]} />
        </mesh>
      ))}
      {basin && (
        <mesh position={[w / 5, 0.0805, 0]} material={mats.bezel}>
          <cylinderGeometry args={[0.017, 0.015, 0.004, 20]} />
        </mesh>
      )}
    </group>
  )
}

/** wall-hung upper cabinet strip */
export function WallCabinet({
  position,
  rotationY = 0,
  w = 0.22,
}: {
  position: [number, number, number]
  rotationY?: number
  w?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh material={mats.furniture}>
        <boxGeometry args={[w, 0.05, 0.035]} />
      </mesh>
      <mesh position={[0, -0.027, 0.004]} material={mats.structure}>
        <boxGeometry args={[w, 0.003, 0.03]} />
      </mesh>
      {[-w / 4, w / 4].map((x) => (
        <mesh key={x} position={[x, 0, 0.0185]} material={mats.bezel}>
          <boxGeometry args={[0.0015, 0.042, 0.001]} />
        </mesh>
      ))}
    </group>
  )
}

/** open shelf with a run of files and binders */
export function Shelf({
  position,
  rotationY = 0,
  levels = 3,
  w = 0.16,
}: {
  position: [number, number, number]
  rotationY?: number
  levels?: number
  w?: number
}) {
  const mats = getMaterials()
  const heights = [0.02, 0.024, 0.018, 0.022, 0.026, 0.02, 0.023]
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={w * 1.3} d={0.09} opacity={0.22} />
      {[-w / 2 + 0.006, w / 2 - 0.006].map((x) => (
        <mesh key={x} position={[x, 0.07 * (levels / 3) + 0.01, 0]} material={mats.deck}>
          <boxGeometry args={[0.008, 0.05 * levels + 0.02, 0.052]} />
        </mesh>
      ))}
      {Array.from({ length: levels }, (_, level) => (
        <group key={level} position={[0, 0.028 + level * 0.05, 0]}>
          <mesh material={mats.deck}>
            <boxGeometry args={[w, 0.005, 0.05]} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh
              key={i}
              position={[-w / 2 + 0.022 + i * 0.019, 0.014 + heights[(level * 3 + i) % 7] / 2 - 0.01, 0]}
              material={i % 3 === 1 ? mats.furniture : mats.paper}
            >
              <boxGeometry args={[0.013, heights[(level * 3 + i) % 7], 0.036]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** small task lamp for a desk, porcelain shade, quiet warm point */
export function DeskLamp({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.002, 0]} material={mats.structure}>
        <cylinderGeometry args={[0.009, 0.011, 0.004, 14]} />
      </mesh>
      <mesh position={[0.006, 0.018, 0]} rotation-z={-0.35} material={mats.structure}>
        <cylinderGeometry args={[0.0016, 0.0016, 0.034, 6]} />
      </mesh>
      <mesh position={[0.013, 0.034, 0]} rotation-z={0.5} material={mats.furniture}>
        <cylinderGeometry args={[0.007, 0.011, 0.012, 14]} />
      </mesh>
    </group>
  )
}

/** a mug left on a surface: someone was just here */
export function Mug({ position }: { position: [number, number, number] }) {
  const mats = getMaterials()
  return (
    <group position={position}>
      <mesh position={[0, 0.005, 0]} material={mats.furniture}>
        <cylinderGeometry args={[0.0055, 0.005, 0.01, 14]} />
      </mesh>
      <mesh position={[0, 0.0095, 0]} material={mats.bezel}>
        <cylinderGeometry args={[0.004, 0.004, 0.001, 12]} />
      </mesh>
    </group>
  )
}
