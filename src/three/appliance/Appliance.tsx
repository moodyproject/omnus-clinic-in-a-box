import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { getMaterials } from '../materials'
import { ReferenceShell } from './ReferenceShell'
import { useReferenceFinish } from './referenceFinish'
import { DEVICE, SLEEVE_BASE } from '../constants'
import { smoothedState, shellOpen, capLift, swin } from '../../scroll/journey'
import {
  makeContactShadowTexture,
  makeEngravingTexture,
  useFontsReady,
} from '../textures'
import type { Quality } from '../../hooks/useMediaFlags'

const HALF = DEVICE.w / 2

/** Small machined details share a restrained bevel, not razor-edged strips. */
function ExteriorDetail({ name, size, position, material, radius = 0.001 }: {
  name: string
  size: [number, number, number]
  position: [number, number, number]
  material: THREE.Material
  radius?: number
}) {
  const [w, h, d] = size
  const geometry = useMemo(() => new RoundedBoxGeometry(w, h, d, 1, radius), [w, h, d, radius])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh name={name} position={position} geometry={geometry} material={material} dispose={null} />
}

/** ribs on the sleeve's underside: the vents reorganized as ceiling structure */
function CeilingRibs({ count }: { count: number }) {
  const mats = getMaterials()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const setLayout = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const span = 1.04
    for (let i = 0; i < count; i++) {
      const x = -span / 2 + (span / (count - 1)) * i
      dummy.position.set(x, 0, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }
  return (
    <instancedMesh ref={setLayout} args={[undefined, undefined, count]} material={mats.fin}>
      <boxGeometry args={[0.012, 0.024, 1.08]} />
    </instancedMesh>
  )
}

export function Appliance({ quality, mobile = false, reducedMotion = false }: { quality: Quality; mobile?: boolean; reducedMotion?: boolean }) {
  const mats = getMaterials()
  const finish = useReferenceFinish()
  const fontsReady = useFontsReady()
  const sleeveRef = useRef<THREE.Group>(null)
  const ledMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#ffffff',
        emissiveIntensity: 1.6,
        toneMapped: false,
      }),
    [],
  )

  const engraving = useMemo(() => makeEngravingTexture('Omnus', 400), [fontsReady]) // eslint-disable-line react-hooks/exhaustive-deps
  const contactShadow = useMemo(() => makeContactShadowTexture(), [])

  useEffect(
    () => () => {
      engraving.dispose()
      contactShadow.dispose()
      ledMat.dispose()
    },
    [engraving, contactShadow, ledMat],
  )

  useFrame(() => {
    const p = smoothedState.p
    const open = shellOpen(p)
    const extra = capLift(p)

    if (sleeveRef.current) {
      // The portrait overhead camera rises above the normal sleeve underside.
      // Keep that panel above its sightline, then restore the original reveal.
      const portraitClearance = mobile ? 1.3 * swin(p, 0.74, 0.79) * (1 - swin(p, 0.89, 0.94)) : 0
      sleeveRef.current.position.y = open * DEVICE.lift + extra * DEVICE.overheadLift + portraitClearance
      sleeveRef.current.rotation.y = 0.03 * open
    }

    // The status light follows the tour, not a clock that keeps the entire
    // clinic rendering while idle. Holds and reverse are deterministic.
    ledMat.emissiveIntensity = reducedMotion ? 1.35 : 1.35 + Math.sin(p * Math.PI * 2) * 0.35
  })

  const shadows = quality.shadows

  return (
    <group>
      {/* four low feet: the device floats on a shadow gap */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            position={[sx * (HALF - 0.18), DEVICE.footH / 2, sz * (HALF - 0.18)]}
            material={mats.bezel}
          >
            <cylinderGeometry args={[0.045, 0.05, DEVICE.footH, 20]} />
          </mesh>
        )),
      )}

      {/* chassis base: this is also the clinic's floor slab */}
      <RoundedBox
        name="reference-base"
        args={[DEVICE.w - 0.05, DEVICE.chassisH, DEVICE.d - 0.05]}
        radius={0.03}
        smoothness={4}
        position={[0, DEVICE.footH + DEVICE.chassisH / 2, 0]}
        material={finish.silver}
        castShadow={shadows}
        receiveShadow={shadows}
      />
      {/* dark base junction below the unchanged clinic floor */}
      <RoundedBox
        name="reference-base-gap"
        args={[DEVICE.w - 0.035, 0.008, DEVICE.d - 0.035]}
        radius={0.003}
        smoothness={3}
        position={[0, SLEEVE_BASE - 0.005, 0]}
        material={finish.dark}
      />

      {/* the one-piece anodized sleeve, lifted by the journey */}
      <group ref={sleeveRef}>
        <ReferenceShell finish={finish} engraving={engraving} indicator={ledMat} shadows={shadows} />

        {/* finished underside, visible while the sleeve hovers: a recessed
            dark ceiling field with the ventilation ribs reorganized as
            ceiling structure. protrudes slightly below the base; hidden
            inside the seam when closed. */}
        <mesh position={[0, SLEEVE_BASE - 0.006, 0]} material={mats.shellInner}>
          <boxGeometry args={[DEVICE.w - 0.14, 0.014, DEVICE.d - 0.14]} />
        </mesh>
        <group position={[0, SLEEVE_BASE - 0.024, 0]}>
          <CeilingRibs count={quality.tier === 'high' ? 15 : 9} />
        </group>

        {/* recessed port field low on the rear face */}
        <group position={[0.3, SLEEVE_BASE + 0.09, -(DEVICE.d / 2 + 0.004)]} rotation-y={Math.PI}>
          <ExteriorDetail name="exterior-port-field" material={finish.edge} size={[0.36, 0.07, 0.006]} position={[0, 0, 0]} radius={0.003} />
          {[-0.13, -0.065, 0, 0.065].map((x) => (
            <ExteriorDetail name="exterior-port-opening" key={x} position={[x, 0, 0.004]} material={mats.bezel} size={[0.044, 0.015, 0.002]} />
          ))}
          <mesh position={[0.135, 0, 0.004]} rotation-x={Math.PI / 2} material={mats.bezel}>
            <cylinderGeometry args={[0.012, 0.012, 0.002, 20]} />
          </mesh>
        </group>
      </group>

      {/* soft contact shadow under the appliance */}
      <mesh position={[0, 0.0015, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.0, 3.0]} />
        <meshBasicMaterial map={contactShadow} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}
