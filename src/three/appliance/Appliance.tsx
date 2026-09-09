import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { getMaterials } from '../materials'
import { DEVICE, SLEEVE_BASE } from '../constants'
import { smoothedState, shellOpen, capLift, swin } from '../../scroll/journey'
import {
  makeContactShadowTexture,
  makeEngravingTexture,
  makeScreenTexture,
  useFontsReady,
} from '../textures'
import type { Quality } from '../../hooks/useMediaFlags'

const HALF = DEVICE.w / 2

/**
 * a precise ventilation band: fine vertical fins inside a recessed channel.
 * used on the sleeve's side and rear faces, never the front.
 */
function VentBand({ count, width }: { count: number; width: number }) {
  const mats = getMaterials()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const setLayout = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const span = width - 0.06
    for (let i = 0; i < count; i++) {
      const x = -span / 2 + (span / (count - 1)) * i
      dummy.position.set(x, 0, 0)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }

  return (
    <group>
      <mesh position={[0, 0, -0.008]} material={mats.inset}>
        <boxGeometry args={[width, 0.24, 0.012]} />
      </mesh>
      <instancedMesh ref={setLayout} args={[undefined, undefined, count]} material={mats.fin}>
        <boxGeometry args={[0.011, 0.2, 0.012]} />
      </instancedMesh>
      {/* channel frame lines */}
      {[-0.125, 0.125].map((y) => (
        <mesh key={y} position={[0, y, -0.002]} material={mats.shellTrim}>
          <boxGeometry args={[width, 0.006, 0.006]} />
        </mesh>
      ))}
    </group>
  )
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
  const fontsReady = useFontsReady()
  const sleeveRef = useRef<THREE.Group>(null)
  const ledMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6f8f83',
        emissive: '#6f8f83',
        emissiveIntensity: 1.6,
        toneMapped: false,
      }),
    [],
  )

  const statusTexture = useMemo(() => makeScreenTexture('status'), [fontsReady]) // eslint-disable-line react-hooks/exhaustive-deps
  const engraving = useMemo(() => makeEngravingTexture(), [fontsReady]) // eslint-disable-line react-hooks/exhaustive-deps
  const contactShadow = useMemo(() => makeContactShadowTexture(), [])

  useEffect(
    () => () => {
      statusTexture.dispose()
      engraving.dispose()
      contactShadow.dispose()
      ledMat.dispose()
    },
    [statusTexture, engraving, contactShadow, ledMat],
  )

  useFrame(({ clock }) => {
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

    // quiet breathing status light
    ledMat.emissiveIntensity = reducedMotion ? 1.35 : 1.35 + Math.sin(clock.elapsedTime * 2.1) * 0.35
  })

  const shadows = quality.shadows
  const finCount = quality.tier === 'high' ? 30 : 18

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
        args={[DEVICE.w - 0.05, DEVICE.chassisH, DEVICE.d - 0.05]}
        radius={0.03}
        smoothness={4}
        position={[0, DEVICE.footH + DEVICE.chassisH / 2, 0]}
        material={mats.chassis}
        castShadow={shadows}
        receiveShadow={shadows}
      />
      {/* chassis front: hairline reveal plus the sage standby light */}
      <mesh
        position={[-0.42, DEVICE.footH + DEVICE.chassisH - 0.028, DEVICE.d / 2 - 0.024]}
        material={ledMat}
      >
        <boxGeometry args={[0.05, 0.006, 0.004]} />
      </mesh>
      <mesh
        position={[0, DEVICE.footH + 0.03, DEVICE.d / 2 - 0.0245]}
        material={mats.shellTrim}
      >
        <boxGeometry args={[DEVICE.w - 0.14, 0.0035, 0.002]} />
      </mesh>

      {/* the one-piece anodized sleeve, lifted by the journey */}
      <group ref={sleeveRef}>
        <RoundedBox
          args={[DEVICE.w, DEVICE.sleeveH, DEVICE.d]}
          radius={DEVICE.radius}
          smoothness={6}
          position={[0, SLEEVE_BASE + DEVICE.sleeveH / 2, 0]}
          material={mats.shell}
          castShadow={shadows}
          receiveShadow={shadows}
        />

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

        {/* machined edge highlights along the top chamfer: a quiet bevel
            catch-light that separates the sleeve from the backdrop */}
        {[
          { pos: [0, DEVICE.sleeveH - 0.008, DEVICE.d / 2 - 0.022] as const, size: [DEVICE.w - 0.16, 0.004, 0.004] as const },
          { pos: [DEVICE.w / 2 - 0.022, DEVICE.sleeveH - 0.008, 0] as const, size: [0.004, 0.004, DEVICE.d - 0.16] as const },
          { pos: [-(DEVICE.w / 2 - 0.022), DEVICE.sleeveH - 0.008, 0] as const, size: [0.004, 0.004, DEVICE.d - 0.16] as const },
        ].map((edge, i) => (
          <mesh
            key={i}
            position={[edge.pos[0], SLEEVE_BASE + edge.pos[1], edge.pos[2]]}
            material={mats.fin}
          >
            <boxGeometry args={edge.size as unknown as [number, number, number]} />
          </mesh>
        ))}

        {/* panel-gap reveal where the sleeve meets the chassis */}
        <mesh position={[0, SLEEVE_BASE + 0.012, DEVICE.d / 2 + 0.0045]} material={mats.inset}>
          <boxGeometry args={[DEVICE.w - 0.1, 0.0035, 0.002]} />
        </mesh>

        {/* front face: clean fascia with restrained instrumentation */}
        <group position={[0, 0, DEVICE.d / 2 + 0.004]}>
          {/* recessed status display, upper right */}
          <group position={[0.34, SLEEVE_BASE + DEVICE.sleeveH - 0.16, 0]}>
            <mesh material={mats.inset}>
              <boxGeometry args={[0.3, 0.084, 0.008]} />
            </mesh>
            <mesh position={[0, 0, 0.0045]} material={mats.bezel}>
              <boxGeometry args={[0.284, 0.07, 0.004]} />
            </mesh>
            <mesh position={[0, 0, 0.007]}>
              <planeGeometry args={[0.27, 0.0605]} />
              <meshBasicMaterial map={statusTexture} toneMapped={false} />
            </mesh>
          </group>
          {/* status light, upper left */}
          <mesh
            position={[-0.5, SLEEVE_BASE + DEVICE.sleeveH - 0.16, 0.002]}
            rotation-x={Math.PI / 2}
            material={ledMat}
          >
            <cylinderGeometry args={[0.007, 0.007, 0.005, 18]} />
          </mesh>
          <mesh
            position={[-0.5, SLEEVE_BASE + DEVICE.sleeveH - 0.16, 0.001]}
            rotation-x={Math.PI / 2}
            material={mats.shellTrim}
          >
            <cylinderGeometry args={[0.013, 0.013, 0.003, 18]} />
          </mesh>
          {/* machined horizontal reveal across the fascia */}
          <mesh position={[0, SLEEVE_BASE + DEVICE.sleeveH - 0.24, 0]} material={mats.shellTrim}>
            <boxGeometry args={[DEVICE.w - 0.1, 0.004, 0.003]} />
          </mesh>
          {/* engraved wordmark, lower right */}
          <mesh position={[0.44, SLEEVE_BASE + 0.085, 0.001]}>
            <planeGeometry args={[0.17, 0.053]} />
            <meshBasicMaterial map={engraving} transparent depthWrite={false} />
          </mesh>
        </group>

        {/* precise ventilation bands on the sides and rear only */}
        <group
          position={[DEVICE.w / 2 + 0.004, SLEEVE_BASE + 0.27, 0]}
          rotation-y={Math.PI / 2}
        >
          <VentBand count={finCount} width={0.96} />
        </group>
        <group
          position={[-(DEVICE.w / 2 + 0.004), SLEEVE_BASE + 0.27, 0]}
          rotation-y={-Math.PI / 2}
        >
          <VentBand count={finCount} width={0.96} />
        </group>
        <group position={[0, SLEEVE_BASE + 0.27, -(DEVICE.d / 2 + 0.004)]} rotation-y={Math.PI}>
          <VentBand count={finCount} width={0.96} />
        </group>

        {/* recessed port field low on the rear face */}
        <group position={[0.3, SLEEVE_BASE + 0.09, -(DEVICE.d / 2 + 0.004)]} rotation-y={Math.PI}>
          <mesh material={mats.inset}>
            <boxGeometry args={[0.36, 0.07, 0.012]} />
          </mesh>
          {[-0.13, -0.065, 0, 0.065].map((x) => (
            <mesh key={x} position={[x, 0, -0.007]} material={mats.bezel}>
              <boxGeometry args={[0.044, 0.015, 0.006]} />
            </mesh>
          ))}
          <mesh position={[0.135, 0, -0.007]} material={mats.bezel}>
            <cylinderGeometry args={[0.012, 0.012, 0.006, 16]} />
          </mesh>
        </group>

        {/* recessed top vent slot near the rear edge */}
        <mesh
          position={[0, SLEEVE_BASE + DEVICE.sleeveH + 0.0015, -(DEVICE.d / 2 - 0.13)]}
          material={mats.inset}
        >
          <boxGeometry args={[0.72, 0.004, 0.035]} />
        </mesh>
      </group>

      {/* soft contact shadow under the appliance */}
      <mesh position={[0, 0.0015, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.0, 3.0]} />
        <meshBasicMaterial map={contactShadow} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}
