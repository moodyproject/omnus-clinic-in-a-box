import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { getMaterials } from '../materials'
import { DEVICE, SHELL_TOP } from '../constants'
import { smoothedState, shellOpen, capLift } from '../../scroll/journey'
import {
  makeContactShadowTexture,
  makeEngravingTexture,
  makeScreenTexture,
  useFontsReady,
} from '../textures'
import type { Quality } from '../../hooks/useMediaFlags'

const HALF_W = DEVICE.w / 2 - 0.006
const HALF_X = DEVICE.w / 4 + 0.0015

/**
 * vertical ventilation channel field, one per shell half. the two fields
 * butt against the center seam so the closed device reads as a single
 * machined face interrupted by one engineered split line.
 */
function VentField({ count, side }: { count: number; side: 1 | -1 }) {
  const mats = getMaterials()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const plateW = 0.575
  // shift the plate toward the seam: outer margin stays, inner edge meets it
  const offsetX = side * (0.312 - 0.012 - plateW / 2)

  const setLayout = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const span = plateW - 0.05
    for (let i = 0; i < count; i++) {
      const x = offsetX - span / 2 + (span / (count - 1)) * i
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
      {/* dark channel plate behind the fins */}
      <mesh position={[offsetX, 0, -0.006]} material={mats.inset}>
        <boxGeometry args={[plateW, 1.02, 0.01]} />
      </mesh>
      <instancedMesh ref={setLayout} args={[undefined, undefined, count]} material={mats.fin}>
        <boxGeometry args={[0.015, 0.96, 0.014]} />
      </instancedMesh>
    </group>
  )
}

/** recessed port field on the back face */
function PortField() {
  const mats = getMaterials()
  const slots = [-0.1, -0.045, 0.01, 0.065]
  return (
    <group>
      <mesh material={mats.inset}>
        <boxGeometry args={[0.34, 0.13, 0.012]} />
      </mesh>
      {slots.map((x, i) => (
        <mesh key={i} position={[x, 0.02, -0.007]} material={mats.bezel}>
          <boxGeometry args={[0.042, 0.014, 0.006]} />
        </mesh>
      ))}
      <mesh position={[0.115, 0.02, -0.007]} material={mats.bezel}>
        <cylinderGeometry args={[0.011, 0.011, 0.006, 16]} />
      </mesh>
      <mesh position={[0, -0.035, -0.007]} material={mats.bezel}>
        <boxGeometry args={[0.24, 0.01, 0.006]} />
      </mesh>
    </group>
  )
}

export function Appliance({ quality }: { quality: Quality }) {
  const mats = getMaterials()
  const fontsReady = useFontsReady()
  const leftRef = useRef<THREE.Group>(null)
  const rightRef = useRef<THREE.Group>(null)
  const capRef = useRef<THREE.Group>(null)
  const ledMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6f8f83',
        emissive: '#6f8f83',
        emissiveIntensity: 1.8,
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
    const lift = capLift(p)

    if (leftRef.current) {
      leftRef.current.position.x = -(HALF_X + DEVICE.slide * open)
      leftRef.current.position.z = 0.075 * open
      leftRef.current.rotation.y = -0.26 * open
    }
    if (rightRef.current) {
      rightRef.current.position.x = HALF_X + DEVICE.slide * open
      rightRef.current.position.z = 0.075 * open
      rightRef.current.rotation.y = 0.26 * open
    }
    if (capRef.current) {
      capRef.current.position.y = SHELL_TOP + DEVICE.capH / 2 + DEVICE.lift * lift
      capRef.current.rotation.y = 0.07 * lift
    }

    // quiet breathing status light
    ledMat.emissiveIntensity = 1.5 + Math.sin(clock.elapsedTime * 2.1) * 0.45
  })

  const shadows = quality.shadows

  return (
    <group>
      {/* base plinth stays put; the clinic floor sits on it */}
      <RoundedBox
        args={[DEVICE.w - 0.08, DEVICE.plinthH, DEVICE.d - 0.08]}
        radius={0.024}
        smoothness={4}
        position={[0, DEVICE.plinthH / 2, 0]}
        material={mats.plinth}
        castShadow={shadows}
        receiveShadow={shadows}
      />

      {/* left shell half */}
      <group ref={leftRef} position={[-HALF_X, 0, 0]}>
        <RoundedBox
          args={[HALF_W, DEVICE.shellH, DEVICE.d]}
          radius={0.045}
          smoothness={5}
          position={[0, DEVICE.plinthH + DEVICE.shellH / 2, 0]}
          material={mats.shell}
          castShadow={shadows}
          receiveShadow={shadows}
        />
        {/* interior lining of the panel, seen when open */}
        <mesh position={[0, DEVICE.plinthH + DEVICE.shellH / 2, 0]} material={mats.shellInner}>
          <boxGeometry args={[HALF_W - 0.03, DEVICE.shellH - 0.03, DEVICE.d - 0.03]} />
        </mesh>
        {/* vent field on the front face */}
        <group position={[0, 0.72, DEVICE.d / 2 + 0.004]}>
          <VentField count={quality.tier === 'high' ? 16 : 10} side={1} />
        </group>
        {/* horizontal machining seam */}
        <mesh position={[0, 1.5, DEVICE.d / 2 + 0.0015]} material={mats.bezel}>
          <boxGeometry args={[HALF_W - 0.05, 0.0035, 0.002]} />
        </mesh>
        {/* status light */}
        <mesh position={[-0.13, 1.62, DEVICE.d / 2 + 0.004]} material={ledMat}>
          <cylinderGeometry args={[0.0055, 0.0055, 0.006, 16]} />
        </mesh>
        {/* port field on the back */}
        <group position={[0.02, 0.42, -DEVICE.d / 2 - 0.004]} rotation={[0, Math.PI, 0]}>
          <PortField />
        </group>
      </group>

      {/* right shell half */}
      <group ref={rightRef} position={[HALF_X, 0, 0]}>
        <RoundedBox
          args={[HALF_W, DEVICE.shellH, DEVICE.d]}
          radius={0.045}
          smoothness={5}
          position={[0, DEVICE.plinthH + DEVICE.shellH / 2, 0]}
          material={mats.shell}
          castShadow={shadows}
          receiveShadow={shadows}
        />
        <mesh position={[0, DEVICE.plinthH + DEVICE.shellH / 2, 0]} material={mats.shellInner}>
          <boxGeometry args={[HALF_W - 0.03, DEVICE.shellH - 0.03, DEVICE.d - 0.03]} />
        </mesh>
        <group position={[0, 0.72, DEVICE.d / 2 + 0.004]}>
          <VentField count={quality.tier === 'high' ? 16 : 10} side={-1} />
        </group>
        <mesh position={[0, 1.5, DEVICE.d / 2 + 0.0015]} material={mats.bezel}>
          <boxGeometry args={[HALF_W - 0.05, 0.0035, 0.002]} />
        </mesh>
        {/* small dark status display */}
        <group position={[0.06, 1.62, DEVICE.d / 2 + 0.003]}>
          <mesh material={mats.bezel}>
            <boxGeometry args={[0.27, 0.075, 0.005]} />
          </mesh>
          <mesh position={[0, 0, 0.0031]}>
            <planeGeometry args={[0.25, 0.0625]} />
            <meshBasicMaterial map={statusTexture} toneMapped={false} />
          </mesh>
        </group>
        {/* machined lettering */}
        <mesh position={[0.16, 0.135, DEVICE.d / 2 + 0.0022]}>
          <planeGeometry args={[0.15, 0.047]} />
          <meshBasicMaterial map={engraving} transparent depthWrite={false} />
        </mesh>
      </group>

      {/* lifted top cap */}
      <group ref={capRef} position={[0, SHELL_TOP + DEVICE.capH / 2, 0]}>
        <RoundedBox
          args={[DEVICE.w, DEVICE.capH, DEVICE.d]}
          radius={0.045}
          smoothness={5}
          material={mats.shell}
          castShadow={shadows}
        />
        {/* dark underside with locating pins, visible while lifted */}
        <mesh position={[0, -DEVICE.capH / 2, 0]} material={mats.inset}>
          <boxGeometry args={[DEVICE.w - 0.14, 0.012, DEVICE.d - 0.14]} />
        </mesh>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh
              key={`${sx}${sz}`}
              position={[sx * 0.5, -DEVICE.capH / 2 - 0.02, sz * 0.5]}
              material={mats.structure}
            >
              <cylinderGeometry args={[0.011, 0.011, 0.045, 10]} />
            </mesh>
          )),
        )}
      </group>

      {/* soft contact shadow under the appliance */}
      <mesh position={[0, 0.0015, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial map={contactShadow} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}
