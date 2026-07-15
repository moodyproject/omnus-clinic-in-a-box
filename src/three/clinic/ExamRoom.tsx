import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { getMaterials } from '../materials'
import { CLINIC } from '../constants'
import { smoothedState, sceneT, swin } from '../../scroll/journey'
import { makeVisitStageTexture, useFontsReady } from '../textures'
import {
  Artwork,
  CoatRail,
  Counter,
  Desk,
  DiagnosticPanel,
  ExamTable,
  Monitor,
  Mug,
  SideChair,
  Stool,
  TallCabinet,
  TaskChair,
  VitalsStation,
  WallCabinet,
  WallSign,
  WallSupplies,
  WasteBin,
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
      {/* the visit: the patient's chair and the physician's stool face each
          other, aligned to where the people actually sit */}
      <SideChair position={[0.265, FLOOR, 0.447]} rotationY={Math.PI} tone="sage" />
      <Stool position={[0.265, FLOOR, 0.203]} />

      {/* physician station against the east wall */}
      <Desk position={[0.49, FLOOR, 0.2]} rotationY={Math.PI / 2} w={0.15} d={0.065} warm />
      <Monitor position={[0.494, FLOOR + 0.079, 0.2]} rotationY={-Math.PI / 2} kind="visit" w={0.065} h={0.042} />
      <TaskChair position={[0.428, FLOOR, 0.2]} rotationY={Math.PI / 2} tone="gray" />
      <Mug position={[0.47, FLOOR + 0.082, 0.248]} />

      {/* examination table with its head toward the back wall */}
      <ExamTable position={[0.45, FLOOR, 0.455]} rotationY={Math.PI} />
      <DiagnosticPanel position={[0.5495, FLOOR + 0.16, 0.42]} rotationY={-Math.PI / 2} />

      {/* closed supply column and coat hook on the back wall */}
      <TallCabinet position={[0.2, FLOOR, 0.524]} rotationY={Math.PI} />
      {detailed && <CoatRail position={[0.152, FLOOR, 0.47]} rotationY={Math.PI / 2} coats={1} />}
      {detailed && <Artwork position={[0.29, FLOOR + 0.165, 0.5455]} rotationY={Math.PI} variant={1} />}

      {/* sink run along the south wall: basin, faucet, gloves, sanitizer */}
      <Counter position={[0.42, FLOOR, 0.17]} rotationY={0} w={0.2} basin />
      {detailed && <WallCabinet position={[0.42, FLOOR + 0.2, 0.157]} rotationY={0} w={0.18} />}
      <WallSupplies position={[0.295, FLOOR, 0.1525]} rotationY={0} />
      <WasteBin position={[0.532, FLOOR, 0.245]} />

      {/* compact vitals station near the door */}
      <VitalsStation position={[0.178, FLOOR, 0.435]} rotationY={Math.PI + 0.5} />

      {/* wayfinding sign on the corridor face of the room wall */}
      <WallSign
        position={[0.1285, FLOOR + 0.19, 0.41]}
        rotationY={-Math.PI / 2}
        text="exam"
        w={0.05}
      />

      {/* wall display carrying the live visit; content fills in with scroll.
          a visible mount keeps it reading as a hung screen, not a slab */}
      <group position={[0.5455, 0.29, 0.33]} rotation-y={-Math.PI / 2}>
        <mesh position={[0, 0, -0.006]} material={mats.steel}>
          <boxGeometry args={[0.05, 0.036, 0.007]} />
        </mesh>
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
