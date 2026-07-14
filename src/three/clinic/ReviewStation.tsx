import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials, PALETTE } from '../materials'
import { CLINIC } from '../constants'
import { smoothedState, sceneT, swin, win } from '../../scroll/journey'
import { makeLabelTexture, useFontsReady } from '../textures'
import { Chair, Desk, DeskLamp, Monitor, Mug, Shelf } from './props'

const FLOOR = CLINIC.floorY
const DESK_TOP = FLOOR + 0.081

const SOAP = ['subjective', 'objective', 'assessment', 'plan']

/**
 * scene 5: the review station. the physician (people layer) sits here and
 * works through the draft; the desk carries the four soap regions and a thin
 * approval bar that fills only when the physician signs off. sage appears
 * solely as that confirmation.
 */
export function ReviewStation() {
  const mats = getMaterials()
  const fontsReady = useFontsReady()
  const approvalRef = useRef<THREE.Mesh>(null)

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
      gateMat.dispose()
      approvedMat.dispose()
      soapTextures.forEach((t) => t.dispose())
      approvedTexture.dispose()
    },
    [gateMat, approvedMat, soapTextures, approvedTexture],
  )

  useFrame(() => {
    const s = sceneT(smoothedState.p, 'review')
    const approve = swin(s, 0.68, 0.9)

    // the approval bar fills only when the physician signs off
    if (approvalRef.current) {
      approvalRef.current.scale.x = Math.max(0.001, approve)
    }
    gateMat.emissiveIntensity = 0.2 + approve * 1.4
    approvedMat.opacity = win(s, 0.86, 0.98)
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
    </group>
  )
}
