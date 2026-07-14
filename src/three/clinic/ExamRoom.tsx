import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials } from '../materials'
import { CLINIC } from '../constants'
import { smoothedState, sceneT, swin } from '../../scroll/journey'
import { makeVisitStageTexture, useFontsReady } from '../textures'
import {
  Cabinet,
  Chair,
  CoatRail,
  Counter,
  Desk,
  ExamTable,
  Monitor,
  Mug,
  WallCabinet,
} from './props'

const FLOOR = CLINIC.floorY

/**
 * scene 4: the exam room, the current product wedge. the physician and
 * patient sit together (the people layer) while the wall display quietly
 * fills in: live video, then transcript, then structured clinical concepts.
 * the interface tells the story; nothing floats in the room.
 */
export function ExamRoom({ detailed }: { detailed: boolean }) {
  const mats = getMaterials()
  const fontsReady = useFontsReady()

  const stages = useMemo(
    () => [makeVisitStageTexture(0), makeVisitStageTexture(1), makeVisitStageTexture(2)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fontsReady],
  )
  const stageMats = useMemo(
    () =>
      stages.map(
        (texture, i) =>
          new THREE.MeshBasicMaterial({
            map: texture,
            toneMapped: false,
            transparent: i > 0,
            opacity: i === 0 ? 1 : 0,
            depthWrite: i === 0,
          }),
      ),
    [stages],
  )

  useEffect(
    () => () => {
      stages.forEach((t) => t.dispose())
      stageMats.forEach((m) => m.dispose())
    },
    [stages, stageMats],
  )

  useFrame(() => {
    const s = sceneT(smoothedState.p, 'during')
    // transcript arrives, then structure completes; both reverse cleanly
    stageMats[1].opacity = swin(s, 0.3, 0.5)
    stageMats[2].opacity = swin(s, 0.62, 0.85)
  })

  const display = { w: 0.13, h: 0.075 }

  return (
    <group>
      {/* the visit: two chairs facing each other */}
      <Chair position={[0.265, FLOOR, 0.46]} rotationY={Math.PI} />
      <Chair position={[0.265, FLOOR, 0.19]} rotationY={0} />

      {/* physician station against the east wall */}
      <Desk position={[0.49, FLOOR, 0.2]} rotationY={Math.PI / 2} w={0.15} d={0.065} />
      <Monitor position={[0.5, FLOOR + 0.081, 0.2]} rotationY={-Math.PI / 2} kind="visit" />
      <Chair position={[0.42, FLOOR, 0.2]} rotationY={-Math.PI / 2} task />

      {/* exam surface and supply cart */}
      <ExamTable position={[0.45, FLOOR, 0.455]} />
      {detailed && <Cabinet position={[0.34, FLOOR, 0.52]} rotationY={Math.PI} openDrawer />}

      {/* built-in sink counter with upper cabinets along the south wall */}
      <Counter position={[0.42, FLOOR, 0.168]} rotationY={0} w={0.2} basin />
      {detailed && <WallCabinet position={[0.42, FLOOR + 0.21, 0.152]} rotationY={0} w={0.18} />}
      {detailed && <CoatRail position={[0.152, FLOOR, 0.38]} rotationY={Math.PI / 2} coats={1} />}
      <Mug position={[0.465, FLOOR + 0.084, 0.245]} />

      {/* wall display carrying the live visit; content fills in with scroll */}
      <group position={[0.547, 0.3, 0.33]} rotation-y={-Math.PI / 2}>
        <mesh material={mats.bezel}>
          <boxGeometry args={[display.w, display.h, 0.006]} />
        </mesh>
        {stageMats.map((mat, i) => (
          <mesh key={i} position={[0, 0, 0.0032 + i * 0.0004]} material={mat}>
            <planeGeometry args={[display.w - 0.007, display.h - 0.007]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
