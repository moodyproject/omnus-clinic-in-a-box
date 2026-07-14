import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials, PALETTE } from '../materials'
import { CLINIC } from '../constants'
import { smoothedState, sceneT, swin } from '../../scroll/journey'
import { InfoPath } from './InfoPath'
import { Cabinet, WallDisplay } from './props'

const FLOOR = CLINIC.floorY
const Y = FLOOR + 0.008

/**
 * scene 6: follow-through. the approved plan physically travels in from the
 * review gate, reaches the room's junction, and branches to four stations:
 * patient summary, prescriptions, referrals, and follow-up.
 */
export function FollowThrough({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const planRef = useRef<THREE.Mesh>(null)

  const planMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.sage,
        emissive: PALETTE.sage,
        emissiveIntensity: 2.0,
        toneMapped: false,
      }),
    [],
  )
  useEffect(() => () => planMat.dispose(), [planMat])

  // the plan's route: out of the review gate, across the corridor, to the junction
  const planCurve = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>()
    const pts = [
      new THREE.Vector3(0.145, Y + 0.01, -0.21),
      new THREE.Vector3(0.0, Y + 0.01, -0.21),
      new THREE.Vector3(-0.2, Y + 0.01, -0.21),
      new THREE.Vector3(-0.3, Y + 0.01, -0.3),
    ]
    for (let i = 0; i < pts.length - 1; i++) {
      path.add(new THREE.LineCurve3(pts[i], pts[i + 1]))
    }
    return path
  }, [])

  const branchIntensity = useMemo(
    () => () => {
      const s = sceneT(smoothedState.p, 'after')
      return swin(s, 0.42, 0.8)
    },
    [],
  )

  useFrame(() => {
    const p = smoothedState.p
    const s = sceneT(p, 'after')
    const travel = swin(s, 0.04, 0.42)
    const mesh = planRef.current
    if (mesh) {
      mesh.visible = s > 0.01 && s < 0.999
      const pt = planCurve.getPointAt(Math.min(0.999, Math.max(0.001, travel)))
      mesh.position.copy(pt)
      // once the branches take over, the plan block settles at the junction
      const settled = swin(s, 0.42, 0.55)
      mesh.scale.setScalar(1 - settled * 0.45)
    }
  })

  const branchPoints: [number, number, number][][] = [
    // patient summary kiosk on the back wall
    [
      [-0.3, Y, -0.3],
      [-0.22, Y, -0.3],
      [-0.22, Y, -0.5],
    ],
    // prescription cabinet
    [
      [-0.3, Y, -0.3],
      [-0.42, Y, -0.3],
      [-0.42, Y, -0.48],
    ],
    // referral tray by the west wall
    [
      [-0.3, Y, -0.3],
      [-0.5, Y, -0.3],
      [-0.5, Y, -0.24],
    ],
    // follow-up queue board
    [
      [-0.3, Y, -0.3],
      [-0.3, Y, -0.42],
      [-0.48, Y, -0.42],
    ],
  ]

  return (
    <group>
      {/* stations built into the room */}
      <WallDisplay position={[-0.22, 0.27, -0.545]} rotationY={0} kind="kiosk" w={0.07} h={0.09} />
      <Cabinet position={[-0.42, FLOOR, -0.5]} rotationY={0} openDrawer />
      {/* referral out-tray, angled */}
      <group position={[-0.525, FLOOR, -0.24]} rotation-y={Math.PI / 2}>
        <mesh position={[0, 0.05, 0]} rotation-x={-0.35} material={mats.structure}>
          <boxGeometry args={[0.06, 0.004, 0.08]} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[0, 0.058 + i * 0.004, -0.005 + i * 0.006]}
            rotation-x={-0.35}
            material={mats.paper}
          >
            <boxGeometry args={[0.05, 0.0015, 0.066]} />
          </mesh>
        ))}
      </group>
      {/* follow-up queue board on the west wall */}
      <WallDisplay
        position={[-0.545, 0.27, -0.42]}
        rotationY={Math.PI / 2}
        kind="inbox"
        w={0.11}
        h={0.068}
      />
      {detailed && (
        <mesh position={[-0.36, FLOOR + 0.001, -0.44]} material={mats.corridor}>
          <boxGeometry args={[0.2, 0.002, 0.16]} />
        </mesh>
      )}

      {/* the approved plan in motion */}
      <mesh ref={planRef} material={planMat}>
        <boxGeometry args={[0.013, 0.006, 0.013]} />
      </mesh>

      {/* four branch routes from the junction */}
      {branchPoints.map((pts, i) => (
        <InfoPath key={i} points={pts} pulses={2} speed={0.16 + i * 0.02} intensity={branchIntensity} />
      ))}
    </group>
  )
}
