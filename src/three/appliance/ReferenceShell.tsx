import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { DEVICE, SLEEVE_BASE } from '../constants'
import type { ReferenceFinish } from './referenceFinish'

/** The supplied reference has clipped corners, not a softened mini-PC outline. */
function outline(width: number, height: number, clip: number) {
  const x = width / 2, y = height / 2
  const shape = new THREE.Shape()
  shape.moveTo(-x + clip, -y)
  shape.lineTo(x - clip, -y)
  shape.lineTo(x, -y + clip)
  shape.lineTo(x, y - clip)
  shape.lineTo(x - clip, y)
  shape.lineTo(-x + clip, y)
  shape.lineTo(-x, y - clip)
  shape.lineTo(-x, -y + clip)
  shape.closePath()
  return shape
}

function clippedGeometry(width: number, height: number, depth: number, clip: number, bevel: number, hollow = false) {
  const shape = outline(width - bevel * 2, height - bevel * 2, clip)
  if (hollow) shape.holes.push(new THREE.Path(outline(width - 0.12, height - 0.12, 0.045).getPoints().reverse()))
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2, steps: 1, bevelEnabled: bevel > 0,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 1,
  })
  geometry.translate(0, 0, -depth / 2 + bevel)
  return geometry
}

/** Shallow dark slot faces represent the reference grille without CSG overhead. */
function SlotGrille({ material }: { material: THREE.Material }) {
  const geometry = useMemo(() => {
    const w = 0.11, r = 0.009, shape = new THREE.Shape()
    shape.moveTo(-w / 2 + r, -r)
    shape.lineTo(w / 2 - r, -r)
    shape.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false)
    shape.lineTo(-w / 2 + r, r)
    shape.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false)
    shape.closePath()
    return new THREE.ShapeGeometry(shape, 6)
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const layout = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const matrix = new THREE.Matrix4()
    for (let row = 0; row < 10; row++) for (let column = 0; column < 7; column++) {
      matrix.makeTranslation((column - 3) * 0.137, (row - 4.5) * 0.046, 0)
      mesh.setMatrixAt(row * 7 + column, matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }
  return <instancedMesh name="reference-slot-grille" ref={layout} args={[geometry, material, 70]} dispose={null} />
}

export function ReferenceShell({ finish, engraving, indicator, shadows }: {
  finish: ReferenceFinish
  engraving: THREE.Texture
  indicator: THREE.Material
  shadows: boolean
}) {
  const geometry = useMemo(() => ({
    housing: clippedGeometry(DEVICE.w, DEVICE.sleeveH, DEVICE.d, 0.055, 0.012, true),
    seam: clippedGeometry(DEVICE.w - 0.10, DEVICE.sleeveH - 0.10, 0.006, 0.05, 0),
    panel: clippedGeometry(DEVICE.w - 0.145, DEVICE.sleeveH - 0.145, 0.008, 0.045, 0.002),
  }), [])
  useEffect(() => () => Object.values(geometry).forEach(g => g.dispose()), [geometry])
  const middle = SLEEVE_BASE + DEVICE.sleeveH / 2, front = DEVICE.d / 2
  return (
    <group name="reference-shell">
      <mesh name="reference-housing" geometry={geometry.housing} position={[0, middle, 0]} material={finish.silver} castShadow={shadows} receiveShadow={shadows} dispose={null} />
      <mesh name="reference-panel-seam" geometry={geometry.seam} position={[0, middle, front - 0.018]} material={finish.dark} dispose={null} />
      <mesh name="reference-front-panel" geometry={geometry.panel} position={[0, middle, front - 0.010]} material={finish.panel} castShadow={shadows} receiveShadow={shadows} dispose={null} />
      {/* Rear closure stays plain; the original rear ports are retained. */}
      <mesh name="reference-rear-panel" geometry={geometry.panel} position={[0, middle, -front + 0.010]} material={finish.panel} dispose={null} />
      <group name="reference-status-window" position={[0.39, SLEEVE_BASE + DEVICE.sleeveH - 0.15, front - 0.002]}>
        <RoundedBox args={[0.23, 0.064, 0.008]} radius={0.003} smoothness={3} material={finish.edge} />
        <RoundedBox args={[0.216, 0.050, 0.004]} radius={0.0015} smoothness={3} position={[0, 0, 0.005]} material={finish.dark} />
        <mesh name="reference-status-point" position={[0.083, 0, 0.008]} material={indicator}>
          <circleGeometry args={[0.006, 20]} />
        </mesh>
      </group>
      <mesh name="reference-wordmark" position={[-0.43, SLEEVE_BASE + 0.13, front - 0.005]}>
        <planeGeometry args={[0.16, 0.05]} />
        <meshBasicMaterial map={engraving} transparent depthWrite={false} />
      </mesh>
      <group position={[DEVICE.w / 2 + 0.0008, middle, 0]} rotation-y={Math.PI / 2}>
        <SlotGrille material={finish.dark} />
      </group>
      <group position={[-DEVICE.w / 2 - 0.0008, middle, 0]} rotation-y={-Math.PI / 2}>
        <SlotGrille material={finish.dark} />
      </group>
    </group>
  )
}
