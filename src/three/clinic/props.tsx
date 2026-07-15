import { useEffect, useMemo } from 'react'
import { getMaterials } from '../materials'
import {
  getSharedShadowTexture,
  makeArtTexture,
  makeLabelTexture,
  useScreenTexture,
  useFontsReady,
  type ScreenKind,
} from '../textures'

/**
 * miniature furniture kit. everything is built from the shared material set
 * so the whole clinic reads as one architectural model. approximate scale:
 * 1 world unit = 10m, so a desk surface sits ~0.078 above the floor and a
 * seat pad at ~0.046.
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

export type UpholsteryTone = 'sage' | 'clay' | 'gray'

function upholstery(tone: UpholsteryTone) {
  const mats = getMaterials()
  return tone === 'sage' ? mats.upholSage : tone === 'clay' ? mats.upholClay : mats.upholGray
}

/** pedestal task chair: satin graphite base, upholstered seat and back */
export function TaskChair({
  position,
  rotationY = 0,
  tone = 'gray',
}: {
  position: [number, number, number]
  rotationY?: number
  tone?: UpholsteryTone
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={0.08} d={0.08} opacity={0.24} />
      {/* base disc + column */}
      <mesh position={[0, 0.004, 0]} material={mats.frame}>
        <cylinderGeometry args={[0.021, 0.024, 0.006, 14]} />
      </mesh>
      <mesh position={[0, 0.023, 0]} material={mats.frame}>
        <cylinderGeometry args={[0.0035, 0.0035, 0.036, 8]} />
      </mesh>
      {/* seat pad */}
      <mesh position={[0, 0.0445, 0]} material={upholstery(tone)}>
        <boxGeometry args={[0.044, 0.009, 0.042]} />
      </mesh>
      {/* back pad on a graphite spine */}
      <mesh position={[0, 0.058, -0.022]} material={mats.frame}>
        <boxGeometry args={[0.007, 0.026, 0.004]} />
      </mesh>
      <mesh position={[0, 0.079, -0.021]} material={upholstery(tone)}>
        <boxGeometry args={[0.038, 0.034, 0.008]} />
      </mesh>
      {/* armrests */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.024, 0.0545, -0.004]} material={mats.frame}>
          <boxGeometry args={[0.0035, 0.014, 0.022]} />
        </mesh>
      ))}
    </group>
  )
}

/** four-legged side chair for waiting and consults: wood-warm frame, pads */
export function SideChair({
  position,
  rotationY = 0,
  tone = 'clay',
}: {
  position: [number, number, number]
  rotationY?: number
  tone?: UpholsteryTone
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={0.075} d={0.075} opacity={0.2} />
      {/* seat pad over a slim frame apron */}
      <mesh position={[0, 0.0405, 0]} material={mats.frame}>
        <boxGeometry args={[0.044, 0.005, 0.042]} />
      </mesh>
      <mesh position={[0, 0.0475, 0]} material={upholstery(tone)}>
        <boxGeometry args={[0.047, 0.01, 0.045]} />
      </mesh>
      {/* backrest, slightly reclined */}
      <group position={[0, 0.073, -0.021]} rotation-x={0.1}>
        <mesh material={upholstery(tone)}>
          <boxGeometry args={[0.047, 0.046, 0.009]} />
        </mesh>
      </group>
      {/* legs */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            position={[sx * 0.018, 0.019, sz * 0.016]}
            rotation-z={sx * -0.05}
            material={mats.frame}
          >
            <cylinderGeometry args={[0.0024, 0.003, 0.04, 6]} />
          </mesh>
        )),
      )}
    </group>
  )
}

/** round physician stool: steel column, sage pad */
export function Stool({
  position,
}: {
  position: [number, number, number]
}) {
  const mats = getMaterials()
  return (
    <group position={position}>
      <ShadowOval w={0.06} d={0.06} opacity={0.22} />
      <mesh position={[0, 0.003, 0]} material={mats.frame}>
        <cylinderGeometry args={[0.018, 0.021, 0.005, 14]} />
      </mesh>
      <mesh position={[0, 0.022, 0]} material={mats.steel}>
        <cylinderGeometry args={[0.003, 0.003, 0.036, 8]} />
      </mesh>
      <mesh position={[0, 0.0445, 0]} material={mats.upholSage}>
        <cylinderGeometry args={[0.021, 0.019, 0.011, 16]} />
      </mesh>
    </group>
  )
}

/**
 * work desk: worktop on ivory side panels with a modesty panel and a
 * drawer pedestal, so it reads as clinic furniture rather than a table
 */
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
  /** oak work surface instead of the dark one */
  warm?: boolean
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={w * 1.5} d={d * 2.2} />
      <mesh position={[0, 0.076, 0]} material={warm ? mats.oak : mats.deskTop}>
        <boxGeometry args={[w, 0.006, d]} />
      </mesh>
      {/* side panels */}
      <mesh position={[-w / 2 + 0.009, 0.037, 0]} material={mats.cabinet}>
        <boxGeometry args={[0.018, 0.073, d - 0.01]} />
      </mesh>
      <mesh position={[w / 2 - 0.009, 0.037, 0]} material={mats.cabinet}>
        <boxGeometry args={[0.018, 0.073, d - 0.01]} />
      </mesh>
      {/* modesty panel */}
      <mesh position={[0, 0.048, -d / 2 + 0.008]} material={mats.cabinet}>
        <boxGeometry args={[w - 0.036, 0.05, 0.006]} />
      </mesh>
      {/* drawer pedestal with steel pulls */}
      <mesh position={[w / 2 - 0.028, 0.038, 0.004]} material={mats.cabinet}>
        <boxGeometry args={[0.036, 0.07, d - 0.016]} />
      </mesh>
      {[0.026, 0.048].map((y) => (
        <mesh key={y} position={[w / 2 - 0.028, y, d / 2 - 0.011]} material={mats.steel}>
          <boxGeometry args={[0.014, 0.0022, 0.0022]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * built-in reception desk: ivory body, oak work surface, raised porcelain
 * transaction ledge toward the approach side, and a kick recess.
 * the +z face is the patient side.
 */
export function ReceptionDesk({
  position,
  rotationY = 0,
  w = 0.2,
}: {
  position: [number, number, number]
  rotationY?: number
  w?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={w * 1.4} d={0.16} opacity={0.3} />
      {/* kick recess */}
      <mesh position={[0, 0.011, -0.002]} material={mats.structure}>
        <boxGeometry args={[w - 0.016, 0.022, 0.075]} />
      </mesh>
      {/* main body */}
      <mesh position={[0, 0.047, 0]} material={mats.cabinet}>
        <boxGeometry args={[w, 0.052, 0.085]} />
      </mesh>
      {/* staff work surface (oak), inset toward -z */}
      <mesh position={[0, 0.0755, -0.012]} material={mats.oak}>
        <boxGeometry args={[w, 0.005, 0.062]} />
      </mesh>
      {/* raised transaction ledge along the patient edge */}
      <mesh position={[0, 0.0625, 0.0345]} material={mats.cabinet}>
        <boxGeometry args={[w, 0.055, 0.016]} />
      </mesh>
      <mesh position={[0, 0.0925, 0.0345]} material={mats.counterTop}>
        <boxGeometry args={[w + 0.006, 0.006, 0.024]} />
      </mesh>
      {/* modesty front seam */}
      <mesh position={[0, 0.047, 0.0432]} material={mats.wallTrim}>
        <boxGeometry args={[w - 0.02, 0.002, 0.0012]} />
      </mesh>
      {/* under-counter storage seams on the staff side */}
      {[-w / 4, w / 4].map((x) => (
        <mesh key={x} position={[x, 0.045, -0.0405]} material={mats.bezel}>
          <boxGeometry args={[0.0015, 0.042, 0.001]} />
        </mesh>
      ))}
    </group>
  )
}

/** desktop monitor with slim bezel and a proper foot */
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
      <mesh position={[0, h / 2 + 0.022, 0]} material={mats.bezel}>
        <boxGeometry args={[w, h, 0.004]} />
      </mesh>
      <mesh position={[0, h / 2 + 0.022, 0.0022]}>
        <planeGeometry args={[w - 0.005, h - 0.005]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* stand */}
      <mesh position={[0, 0.011, -0.006]} rotation-x={0.18} material={mats.frame}>
        <boxGeometry args={[0.008, 0.024, 0.004]} />
      </mesh>
      <mesh position={[0, 0.0015, -0.008]} material={mats.frame}>
        <boxGeometry args={[0.028, 0.003, 0.018]} />
      </mesh>
    </group>
  )
}

/** fixed wall display */
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

/**
 * examination table: steel-framed base, ivory drawer body, sage upholstered
 * pad with a raised head section and a paper roll at the head end (-z).
 */
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
      <ShadowOval w={0.13} d={0.24} opacity={0.34} />
      {/* base frame + drawer body */}
      <mesh position={[0, 0.008, 0]} material={mats.frame}>
        <boxGeometry args={[0.052, 0.016, 0.115]} />
      </mesh>
      <mesh position={[0, 0.034, 0]} material={mats.cabinet}>
        <boxGeometry args={[0.056, 0.038, 0.125]} />
      </mesh>
      {[-0.03, 0.03].map((z) => (
        <mesh key={z} position={[0.0285, 0.034, z]} material={mats.steel}>
          <boxGeometry args={[0.0018, 0.002, 0.016]} />
        </mesh>
      ))}
      {/* upholstered pad with steel side rails */}
      <mesh position={[0, 0.0615, 0.012]} material={mats.upholSage}>
        <boxGeometry args={[0.062, 0.017, 0.125]} />
      </mesh>
      {[-0.033, 0.033].map((x) => (
        <mesh key={x} position={[x, 0.054, 0.005]} material={mats.steel}>
          <boxGeometry args={[0.0022, 0.0022, 0.1]} />
        </mesh>
      ))}
      {/* raised head section */}
      <group position={[0, 0.0705, -0.0595]} rotation-x={0.4}>
        <mesh material={mats.upholSage}>
          <boxGeometry args={[0.062, 0.014, 0.052]} />
        </mesh>
      </group>
      {/* graphite piping along the pad edges keeps the table reading as
          upholstered furniture even from straight overhead */}
      {[-0.0305, 0.0305].map((x) => (
        <mesh key={x} position={[x, 0.0702, 0.012]} material={mats.frame}>
          <boxGeometry args={[0.0016, 0.0016, 0.125]} />
        </mesh>
      ))}
      {/* small pillow at the head */}
      <mesh position={[0, 0.0785, -0.052]} rotation-x={0.4} material={mats.paper}>
        <boxGeometry args={[0.04, 0.008, 0.026]} />
      </mesh>
      {/* paper roll under the head + runner along the pad */}
      <mesh
        position={[0, 0.085, -0.083]}
        rotation-z={Math.PI / 2}
        material={mats.paper}
      >
        <cylinderGeometry args={[0.007, 0.007, 0.05, 12]} />
      </mesh>
      <mesh position={[0, 0.0712, 0.018]} material={mats.paper}>
        <boxGeometry args={[0.05, 0.0014, 0.1]} />
      </mesh>
      {/* step */}
      <mesh position={[0, 0.008, 0.078]} material={mats.steel}>
        <boxGeometry args={[0.04, 0.005, 0.022]} />
      </mesh>
    </group>
  )
}

/** low cabinet: ivory body, mineral top, steel pulls */
export function Cabinet({
  position,
  rotationY = 0,
  w = 0.09,
}: {
  position: [number, number, number]
  rotationY?: number
  w?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={w * 1.5} d={0.09} />
      <mesh position={[0, 0.009, 0]} material={mats.structure}>
        <boxGeometry args={[w - 0.012, 0.018, 0.042]} />
      </mesh>
      <mesh position={[0, 0.049, 0]} material={mats.cabinet}>
        <boxGeometry args={[w, 0.062, 0.05]} />
      </mesh>
      <mesh position={[0, 0.0825, 0]} material={mats.counterTop}>
        <boxGeometry args={[w + 0.004, 0.005, 0.054]} />
      </mesh>
      {/* drawer seams + pulls */}
      {[0.033, 0.061].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0.0252]} material={mats.bezel}>
            <boxGeometry args={[w - 0.01, 0.0014, 0.001]} />
          </mesh>
          <mesh position={[0, y + 0.007, 0.026]} material={mats.steel}>
            <boxGeometry args={[0.016, 0.002, 0.002]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** tall closed supply column with double doors */
export function TallCabinet({
  position,
  rotationY = 0,
  w = 0.07,
  h = 0.185,
}: {
  position: [number, number, number]
  rotationY?: number
  w?: number
  h?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={w * 1.5} d={0.08} opacity={0.3} />
      <mesh position={[0, 0.008, 0]} material={mats.structure}>
        <boxGeometry args={[w - 0.01, 0.016, 0.04]} />
      </mesh>
      <mesh position={[0, h / 2 + 0.014, 0]} material={mats.cabinet}>
        <boxGeometry args={[w, h, 0.048]} />
      </mesh>
      {/* center door seam + handles */}
      <mesh position={[0, h / 2 + 0.014, 0.0242]} material={mats.bezel}>
        <boxGeometry args={[0.0014, h - 0.012, 0.001]} />
      </mesh>
      {[-0.008, 0.008].map((x) => (
        <mesh key={x} position={[x, h / 2 + 0.014, 0.025]} material={mats.steel}>
          <boxGeometry args={[0.0022, 0.022, 0.002]} />
        </mesh>
      ))}
    </group>
  )
}

/** self check-in kiosk near the entrance */
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
      <ShadowOval w={0.05} d={0.05} opacity={0.2} />
      <mesh position={[0, 0.0025, 0]} material={mats.frame}>
        <cylinderGeometry args={[0.016, 0.019, 0.005, 14]} />
      </mesh>
      <mesh position={[0, 0.05, 0]} material={mats.frame}>
        <cylinderGeometry args={[0.0045, 0.006, 0.09, 10]} />
      </mesh>
      <group position={[0, 0.1, 0.004]} rotation-x={-0.35}>
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
      <mesh position={[0, 0.034, 0]} material={mats.oak}>
        <cylinderGeometry args={[0.032, 0.032, 0.007, 18]} />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <mesh
          key={i}
          position={[Math.sin((i * Math.PI * 2) / 3) * 0.018, 0.016, Math.cos((i * Math.PI * 2) / 3) * 0.018]}
          rotation-z={Math.sin((i * Math.PI * 2) / 3) * 0.14}
          rotation-x={-Math.cos((i * Math.PI * 2) / 3) * 0.14}
          material={mats.frame}
        >
          <cylinderGeometry args={[0.0026, 0.003, 0.033, 6]} />
        </mesh>
      ))}
      <mesh position={[0.006, 0.039, 0.004]} rotation-y={0.4} material={mats.paper}>
        <boxGeometry args={[0.024, 0.0015, 0.032]} />
      </mesh>
      <mesh position={[-0.007, 0.0405, -0.003]} rotation-y={-0.2} material={mats.paper}>
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
      <mesh position={[0, 0.21, 0]} material={mats.steel}>
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

/** built-in counter run along a wall: ivory cabinetry, mineral top */
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
  /** oak worktop instead of the mineral one */
  warm?: boolean
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={w * 1.25} d={0.11} opacity={0.24} />
      {/* kick recess */}
      <mesh position={[0, 0.011, -0.004]} material={mats.structure}>
        <boxGeometry args={[w - 0.02, 0.022, 0.048]} />
      </mesh>
      {/* body */}
      <mesh position={[0, 0.049, 0]} material={mats.cabinet}>
        <boxGeometry args={[w, 0.054, 0.06]} />
      </mesh>
      {/* top */}
      <mesh position={[0, 0.0785, 0]} material={warm ? mats.oak : mats.counterTop}>
        <boxGeometry args={[w + 0.008, 0.006, 0.066]} />
      </mesh>
      {/* door seams + steel pulls */}
      {[-w / 4, 0, w / 4].map((x) => (
        <mesh key={x} position={[x, 0.049, 0.0305]} material={mats.bezel}>
          <boxGeometry args={[0.0015, 0.048, 0.001]} />
        </mesh>
      ))}
      {[-w / 4 + 0.014, w / 4 + 0.014].map((x) => (
        <mesh key={x} position={[x, 0.066, 0.031]} material={mats.steel}>
          <boxGeometry args={[0.012, 0.002, 0.002]} />
        </mesh>
      ))}
      {basin && (
        <group position={[w / 5, 0, 0]}>
          {/* recessed basin + gooseneck faucet */}
          <mesh position={[0, 0.0815, 0]} material={mats.steel}>
            <cylinderGeometry args={[0.016, 0.0145, 0.003, 20]} />
          </mesh>
          <mesh position={[0, 0.0815, 0]} material={mats.bezel}>
            <cylinderGeometry args={[0.0125, 0.011, 0.0034, 18]} />
          </mesh>
          <mesh position={[0, 0.093, -0.017]} material={mats.steel}>
            <cylinderGeometry args={[0.0016, 0.0016, 0.023, 6]} />
          </mesh>
          <mesh position={[0, 0.1045, -0.009]} rotation-x={Math.PI / 2} material={mats.steel}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.017, 6]} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/** wall-hung upper cabinet strip with an under-cabinet shadow line */
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
      <mesh material={mats.cabinet}>
        <boxGeometry args={[w, 0.05, 0.035]} />
      </mesh>
      <mesh position={[0, -0.026, 0.002]} material={mats.structure}>
        <boxGeometry args={[w, 0.003, 0.032]} />
      </mesh>
      {[-w / 4, w / 4].map((x) => (
        <mesh key={x} position={[x, 0, 0.0185]} material={mats.bezel}>
          <boxGeometry args={[0.0015, 0.042, 0.001]} />
        </mesh>
      ))}
      {[-w / 4 - 0.011, w / 4 + 0.011].map((x) => (
        <mesh key={x} position={[x, -0.016, 0.019]} material={mats.steel}>
          <boxGeometry args={[0.009, 0.002, 0.002]} />
        </mesh>
      ))}
    </group>
  )
}

/** open shelf with a run of files and binders: oak boards, graphite sides */
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
      {[-w / 2 + 0.005, w / 2 - 0.005].map((x) => (
        <mesh key={x} position={[x, 0.07 * (levels / 3) + 0.01, 0]} material={mats.frame}>
          <boxGeometry args={[0.007, 0.05 * levels + 0.02, 0.05]} />
        </mesh>
      ))}
      {Array.from({ length: levels }, (_, level) => (
        <group key={level} position={[0, 0.028 + level * 0.05, 0]}>
          <mesh material={mats.oak}>
            <boxGeometry args={[w, 0.005, 0.048]} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh
              key={i}
              position={[-w / 2 + 0.022 + i * 0.019, 0.014 + heights[(level * 3 + i) % 7] / 2 - 0.01, 0]}
              material={i % 3 === 1 ? mats.upholSage : i % 3 === 2 ? mats.furniture : mats.paper}
            >
              <boxGeometry args={[0.013, heights[(level * 3 + i) % 7], 0.036]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** small task lamp for a desk: graphite arm, warm porcelain shade */
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
      <mesh position={[0, 0.002, 0]} material={mats.frame}>
        <cylinderGeometry args={[0.009, 0.011, 0.004, 14]} />
      </mesh>
      <mesh position={[0.006, 0.018, 0]} rotation-z={-0.35} material={mats.frame}>
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

/** small wall-mounted waste bin / glove-and-supply holder pair */
export function WallSupplies({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      {/* glove box with dark opening */}
      <mesh position={[-0.012, 0.155, 0.004]} material={mats.furniture}>
        <boxGeometry args={[0.016, 0.022, 0.008]} />
      </mesh>
      <mesh position={[-0.012, 0.152, 0.0082]} material={mats.bezel}>
        <boxGeometry args={[0.01, 0.004, 0.0008]} />
      </mesh>
      {/* sanitizer dispenser with dark nozzle */}
      <mesh position={[0.012, 0.152, 0.004]} material={mats.furniture}>
        <boxGeometry args={[0.012, 0.026, 0.007]} />
      </mesh>
      <mesh position={[0.012, 0.1405, 0.006]} material={mats.bezel}>
        <boxGeometry args={[0.006, 0.004, 0.005]} />
      </mesh>
    </group>
  )
}

/** small floor waste bin */
export function WasteBin({ position }: { position: [number, number, number] }) {
  const mats = getMaterials()
  return (
    <group position={position}>
      <ShadowOval w={0.032} d={0.032} opacity={0.2} />
      <mesh position={[0, 0.014, 0]} material={mats.steel}>
        <cylinderGeometry args={[0.0105, 0.009, 0.028, 14]} />
      </mesh>
      <mesh position={[0, 0.0285, 0]} material={mats.bezel}>
        <cylinderGeometry args={[0.0095, 0.0095, 0.0016, 14]} />
      </mesh>
    </group>
  )
}

/** wall-mounted diagnostic instrument panel beside the exam table */
export function DiagnosticPanel({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      {/* graphite backplate so the instruments read against the wall */}
      <mesh material={mats.structure}>
        <boxGeometry args={[0.046, 0.052, 0.005]} />
      </mesh>
      {/* two instruments on coiled leads, abstracted */}
      {[-0.011, 0.011].map((x) => (
        <group key={x} position={[x, 0.01, 0.005]}>
          <mesh material={mats.steel}>
            <cylinderGeometry args={[0.003, 0.0035, 0.018, 8]} />
          </mesh>
          <mesh position={[0, -0.013, 0]} material={mats.furniture}>
            <cylinderGeometry args={[0.0016, 0.0016, 0.012, 6]} />
          </mesh>
        </group>
      ))}
      {/* small supply tray under */}
      <mesh position={[0, -0.021, 0.007]} material={mats.steel}>
        <boxGeometry args={[0.038, 0.003, 0.012]} />
      </mesh>
    </group>
  )
}

/** compact vitals station: column, small readout, cuff hook */
export function VitalsStation({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={0.05} d={0.05} opacity={0.22} />
      <mesh position={[0, 0.0025, 0]} material={mats.frame}>
        <cylinderGeometry args={[0.014, 0.017, 0.005, 12]} />
      </mesh>
      <mesh position={[0, 0.05, 0]} material={mats.steel}>
        <cylinderGeometry args={[0.0028, 0.0035, 0.09, 8]} />
      </mesh>
      {/* readout head */}
      <group position={[0, 0.1, 0.003]} rotation-x={-0.3}>
        <mesh material={mats.furniture}>
          <boxGeometry args={[0.028, 0.022, 0.008]} />
        </mesh>
        <mesh position={[0, 0.002, 0.0042]} material={mats.bezel}>
          <boxGeometry args={[0.02, 0.011, 0.0008]} />
        </mesh>
      </group>
      {/* cuff basket */}
      <mesh position={[0, 0.062, 0.008]} material={mats.steel}>
        <boxGeometry args={[0.018, 0.012, 0.01]} />
      </mesh>
    </group>
  )
}

/** potted plant: matte ceramic vessel, restrained foliage */
export function Plant({
  position,
  size = 1,
}: {
  position: [number, number, number]
  size?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} scale={size}>
      <ShadowOval w={0.045} d={0.045} opacity={0.2} />
      <mesh position={[0, 0.016, 0]} material={mats.ceramic}>
        <cylinderGeometry args={[0.014, 0.011, 0.032, 14]} />
      </mesh>
      {[
        [0, 0.052, 0, 0.016],
        [0.009, 0.043, 0.004, 0.011],
        [-0.008, 0.045, -0.003, 0.012],
        [0.002, 0.04, 0.009, 0.009],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} material={mats.leaf}>
          <sphereGeometry args={[r, 8, 6]} />
        </mesh>
      ))}
    </group>
  )
}

/** slim water station: hospitality without a hotel lobby */
export function WaterStation({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      {/* carafe + stack of cups on a small tray */}
      <mesh position={[0, 0.0015, 0]} material={mats.steel}>
        <boxGeometry args={[0.04, 0.0025, 0.024]} />
      </mesh>
      <mesh position={[-0.01, 0.013, 0]} material={mats.ceramic}>
        <cylinderGeometry args={[0.0055, 0.007, 0.022, 12]} />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0.009, 0.005 + i * 0.007, 0.002]} material={mats.furniture}>
          <cylinderGeometry args={[0.004, 0.0032, 0.007, 10]} />
        </mesh>
      ))}
    </group>
  )
}

/** framed print on a wall */
export function Artwork({
  position,
  rotationY = 0,
  variant = 0,
  w = 0.034,
}: {
  position: [number, number, number]
  rotationY?: number
  variant?: 0 | 1 | 2
  w?: number
}) {
  const mats = getMaterials()
  const texture = useMemo(() => makeArtTexture(variant), [variant])
  useEffect(() => () => texture.dispose(), [texture])
  const h = w * 1.25
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh material={mats.frame}>
        <boxGeometry args={[w + 0.004, h + 0.004, 0.004]} />
      </mesh>
      <mesh position={[0, 0, 0.0022]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  )
}

/** upholstered acoustic wall panel: warmth and depth on large wall fields */
export function AcousticPanel({
  position,
  rotationY = 0,
  w = 0.1,
  h = 0.06,
  tone = 'sage',
}: {
  position: [number, number, number]
  rotationY?: number
  w?: number
  h?: number
  tone?: UpholsteryTone
}) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh material={upholstery(tone)}>
        <boxGeometry args={[w, h, 0.006]} />
      </mesh>
    </group>
  )
}

/** small wall sign with engraved text */
export function WallSign({
  position,
  rotationY = 0,
  text,
  w = 0.05,
}: {
  position: [number, number, number]
  rotationY?: number
  text: string
  w?: number
}) {
  const mats = getMaterials()
  const fontsReady = useFontsReady()
  const texture = useMemo(
    () => makeLabelTexture(text, { color: 'rgba(244, 239, 228, 0.92)', size: 54 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, fontsReady],
  )
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh material={mats.structure}>
        <boxGeometry args={[w, w / 3.4, 0.004]} />
      </mesh>
      <mesh position={[0, 0, 0.0022]}>
        <planeGeometry args={[w - 0.004, (w - 0.004) / 4]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

/** stack of letter trays with worked paper */
export function TrayStack({
  position,
  rotationY = 0,
  levels = 2,
}: {
  position: [number, number, number]
  rotationY?: number
  levels?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      {Array.from({ length: levels }, (_, i) => (
        <group key={i} position={[0, i * 0.011, 0]}>
          <mesh position={[0, 0.002, 0]} material={mats.frame}>
            <boxGeometry args={[0.03, 0.0016, 0.04]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.0145, 0.0055, 0]} material={mats.frame}>
              <boxGeometry args={[0.0014, 0.009, 0.04]} />
            </mesh>
          ))}
          <mesh position={[0, 0.0042, 0]} material={mats.paper}>
            <boxGeometry args={[0.026, 0.0028, 0.036]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** compact document printer for the coordination room */
export function Printer({
  position,
  rotationY = 0,
}: {
  position: [number, number, number]
  rotationY?: number
}) {
  const mats = getMaterials()
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.011, 0]} material={mats.furniture}>
        <boxGeometry args={[0.036, 0.022, 0.03]} />
      </mesh>
      <mesh position={[0, 0.0225, 0]} material={mats.bezel}>
        <boxGeometry args={[0.03, 0.0014, 0.02]} />
      </mesh>
      {/* exit tray with a fresh sheet */}
      <mesh position={[0, 0.008, 0.019]} material={mats.frame}>
        <boxGeometry args={[0.028, 0.0016, 0.012]} />
      </mesh>
      <mesh position={[0, 0.0095, 0.019]} material={mats.paper}>
        <boxGeometry args={[0.021, 0.0012, 0.01]} />
      </mesh>
    </group>
  )
}

/**
 * built-in operations console: ivory cabinet base, mineral counter, one
 * angled screen and an engraved label plate. shared design across the six
 * operational stations so the corridor reads architect-designed.
 */
export function OpsConsole({
  position,
  rotationY = 0,
  kind,
  label,
  w = 0.11,
}: {
  position: [number, number, number]
  rotationY?: number
  kind: ScreenKind
  label: string
  w?: number
}) {
  const mats = getMaterials()
  const texture = useScreenTexture(kind)
  const fontsReady = useFontsReady()
  const labelTex = useMemo(
    () => makeLabelTexture(label, { color: 'rgba(17, 19, 21, 0.58)', size: 44 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [label, fontsReady],
  )
  useEffect(() => () => labelTex.dispose(), [labelTex])
  return (
    <group position={position} rotation-y={rotationY}>
      <ShadowOval w={w * 1.4} d={0.1} opacity={0.26} />
      {/* kick + body + counter (standing height) */}
      <mesh position={[0, 0.01, -0.003]} material={mats.structure}>
        <boxGeometry args={[w - 0.014, 0.02, 0.05]} />
      </mesh>
      <mesh position={[0, 0.055, 0]} material={mats.cabinet}>
        <boxGeometry args={[w, 0.066, 0.058]} />
      </mesh>
      <mesh position={[0, 0.0905, 0]} material={mats.counterTop}>
        <boxGeometry args={[w + 0.006, 0.005, 0.064]} />
      </mesh>
      {/* door seams */}
      {[-w / 4, w / 4].map((x) => (
        <mesh key={x} position={[x, 0.055, 0.0295]} material={mats.bezel}>
          <boxGeometry args={[0.0014, 0.052, 0.001]} />
        </mesh>
      ))}
      {/* angled screen on the counter */}
      <group position={[0, 0.108, -0.008]} rotation-x={-0.28}>
        <mesh material={mats.bezel}>
          <boxGeometry args={[0.062, 0.042, 0.004]} />
        </mesh>
        <mesh position={[0, 0, 0.0022]}>
          <planeGeometry args={[0.057, 0.037]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
      {/* engraved label on the counter front edge */}
      <mesh position={[0, 0.0785, 0.0325]} rotation-x={-0.5}>
        <planeGeometry args={[0.052, 0.013]} />
        <meshBasicMaterial map={labelTex} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}
