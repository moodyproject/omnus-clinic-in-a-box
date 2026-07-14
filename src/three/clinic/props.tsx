import { getMaterials } from '../materials'
import { useScreenTexture, type ScreenKind } from '../textures'

/**
 * miniature furniture kit. everything is built from the shared material set
 * so the whole clinic reads as one architectural model. approximate scale:
 * 1 world unit = 10m, so a desk is ~0.08 tall.
 */

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
}: {
  position: [number, number, number]
  rotationY?: number
  w?: number
  d?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.078, 0]} material={mats.deskTop}>
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
      <mesh position={[0, 0.032, 0]} material={mats.furniture}>
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
