import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials, PALETTE } from '../materials'
import { CLINIC } from '../constants'
import { smoothedState, sceneT, swin, win } from '../../scroll/journey'
import { makeLabelTexture, useFontsReady } from '../textures'
import {
  AcousticPanel,
  Artwork,
  Cabinet,
  Desk,
  DeskLamp,
  Monitor,
  Mug,
  Plant,
  Shelf,
  TaskChair,
  TrayStack,
  WallSign,
} from './props'

const FLOOR = CLINIC.floorY
const DESK_TOP = FLOOR + 0.079

const SOAP = ['subjective', 'objective', 'assessment', 'plan']

/**
 * scene 5: the review station. the physician (people layer) sits here and
 * works through the draft; the desk carries the four soap regions and a thin
 * approval bar that fills only when the physician signs off. sage appears
 * solely as that confirmation.
 */
export function ReviewStation({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const fontsReady = useFontsReady()

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
    () => SOAP.map((t) => makeLabelTexture(t, { color: 'rgba(238, 236, 229, 0.62)', size: 46 })),
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

    // fixed approval instrument changes state without changing geometry
    gateMat.emissiveIntensity = 0.2 + approve * 1.4
    approvedMat.opacity = win(s, 0.86, 0.98)
  })

  return (
    <group>
      {/* the physician's desk faces the back wall; the chair sits where the
          physician actually lands */}
      <Desk position={[0.34, FLOOR, -0.46]} rotationY={0} w={0.2} d={0.09} warm />
      <Monitor position={[0.34, DESK_TOP, -0.49]} rotationY={0} kind="draft" w={0.085} h={0.055} />
      <TaskChair position={[0.339, FLOOR, -0.378]} rotationY={Math.PI + 0.25} tone="sage" />

      {/* the physician's own room: references, task light, a left mug */}
      <Shelf position={[0.525, FLOOR, -0.3]} rotationY={-Math.PI / 2} levels={3} w={0.14} />
      <Cabinet position={[0.524, FLOOR, -0.195]} rotationY={-Math.PI / 2} w={0.09} />
      {detailed && <Plant position={[0.524, FLOOR + 0.085, -0.195]} size={0.7} />}
      <DeskLamp position={[0.258, DESK_TOP + 0.002, -0.482]} rotationY={-0.6} />
      <TrayStack position={[0.425, DESK_TOP, -0.482]} levels={2} />
      <Mug position={[0.412, DESK_TOP + 0.002, -0.428]} />
      <AcousticPanel
        position={[0.34, FLOOR + 0.135, -0.5485]}
        rotationY={0}
        w={0.18}
        h={0.06}
        tone="gray"
      />
      {detailed && <Artwork position={[0.152, FLOOR + 0.16, -0.46]} rotationY={Math.PI / 2} variant={2} />}
      <WallSign
        position={[0.1285, FLOOR + 0.19, -0.41]}
        rotationY={-Math.PI / 2}
        text="review"
        w={0.05}
      />

      {/* four soap regions inlaid in the desk surface */}
      {[
        [0.295, -0.428],
        [0.385, -0.428],
        [0.295, -0.478],
        [0.385, -0.478],
      ].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, DESK_TOP + 0.0008, z]} material={mats.bezel}>
            <boxGeometry args={[0.052, 0.0014, 0.036]} />
          </mesh>
          <mesh position={[x, DESK_TOP + 0.002, z + 0.0105]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.05, 0.0125]} />
            <meshBasicMaterial map={soapTextures[i]} transparent depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* the approval gate: a thin bar on the desk edge, no ceremony */}
      <mesh position={[0.34, DESK_TOP + 0.002, -0.411]} material={mats.bezel}>
        <boxGeometry args={[0.1, 0.0022, 0.005]} />
      </mesh>
      <mesh position={[0.34, DESK_TOP + 0.0034, -0.411]} material={gateMat}>
        <boxGeometry args={[0.1, 0.002, 0.0042]} />
      </mesh>
      <mesh position={[0.34, DESK_TOP + 0.027, -0.409]}>
        <planeGeometry args={[0.11, 0.0165]} />
        <primitive object={approvedMat} attach="material" />
      </mesh>
    </group>
  )
}
