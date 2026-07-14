import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PALETTE } from '../materials'
import { CLINIC } from '../constants'
import { lerp } from '../../lib/math'
import { smoothedState, sceneT, swin, win } from '../../scroll/journey'
import { makeLabelTexture, useFontsReady } from '../textures'
import { Cabinet, Chair, Desk, ExamTable, Monitor, WallDisplay } from './props'

const FLOOR = CLINIC.floorY

const N = 36
const CLUSTER_LABELS = ['symptoms', 'medications', 'history', 'assessment', 'plan', 'follow-up']

const dummy = new THREE.Object3D()

type V3 = [number, number, number]

/**
 * scene 4: the exam and telehealth room, the current product wedge.
 * thin sage audio waves hover in the conversation space, become transcript
 * segments at the physician station, then resolve into six structured
 * clinical clusters. all three layouts are fixed; scroll interpolates.
 */
export function ExamRoom({ detailed }: { detailed: boolean }) {
  const blocksRef = useRef<THREE.InstancedMesh>(null)
  const fontsReady = useFontsReady()

  const blockMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.sage,
        emissive: PALETTE.sage,
        emissiveIntensity: 0.9,
        toneMapped: false,
      }),
    [],
  )

  const labelData = useMemo(() => {
    return CLUSTER_LABELS.map((text) => ({
      texture: makeLabelTexture(text, { color: 'rgba(111, 143, 131, 0.95)', size: 52 }),
      material: null as THREE.MeshBasicMaterial | null,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsReady])

  const labelMats = useRef<THREE.MeshBasicMaterial[]>([])

  useEffect(() => {
    return () => {
      blockMat.dispose()
      labelData.forEach((l) => l.texture.dispose())
    }
  }, [blockMat, labelData])

  const layouts = useMemo(() => {
    const wave: V3[] = []
    const transcript: V3[] = []
    const cluster: V3[] = []
    // cluster centers: two shelves of three above the physician station
    const centers: V3[] = [
      [0.455, 0.275, 0.115],
      [0.455, 0.275, 0.185],
      [0.455, 0.275, 0.255],
      [0.455, 0.35, 0.115],
      [0.455, 0.35, 0.185],
      [0.455, 0.35, 0.255],
    ]
    for (let i = 0; i < N; i++) {
      // a thin wave arc floating in the conversation space between the chairs
      const f = i / (N - 1)
      wave.push([0.265 + Math.sin(f * Math.PI) * 0.015, 0.272, 0.2 + f * 0.24])
      // transcript rows beside the wall display
      const col = i % 6
      const row = Math.floor(i / 6)
      transcript.push([0.5, 0.235 + row * 0.021, 0.245 + col * 0.023])
      // structured clusters: six items per cluster in a 2x3 micro grid
      const c = centers[Math.floor(i / 6)]
      const j = i % 6
      cluster.push([c[0], c[1] + (Math.floor(j / 3) - 0.5) * 0.016, c[2] + ((j % 3) - 1) * 0.017])
    }
    return { wave, transcript, cluster, centers }
  }, [])

  useFrame(({ clock }) => {
    const p = smoothedState.p
    const s = sceneT(p, 'during')
    const stage1 = swin(s, 0.36, 0.6)
    const stage2 = swin(s, 0.62, 0.86)
    const wavePresence = 1 - stage1
    const time = clock.elapsedTime

    const mesh = blocksRef.current
    if (mesh) {
      for (let i = 0; i < N; i++) {
        const w = layouts.wave[i]
        const t = layouts.transcript[i]
        const c = layouts.cluster[i]
        const x = lerp(lerp(w[0], t[0], stage1), c[0], stage2)
        const y = lerp(lerp(w[1], t[1], stage1), c[1], stage2)
        const z = lerp(lerp(w[2], t[2], stage1), c[2], stage2)
        dummy.position.set(x, y, z)
        // audible wave while in wave form; flat segments afterwards
        const amp = wavePresence * (0.9 + Math.sin(time * 3.1 + i * 0.62) * 0.85)
        dummy.scale.set(1, 1 + Math.max(0, amp) * 1.8, 1 + stage1 * 2.2 - stage2 * 1.2)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }

    blockMat.emissiveIntensity = 0.9 - stage1 * 0.45 + stage2 * 0.35

    const labelOpacity = win(s, 0.82, 0.96)
    for (const m of labelMats.current) {
      if (m) m.opacity = labelOpacity
    }
  })

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

      {/* wall display carrying the live visit */}
      <WallDisplay position={[0.547, 0.3, 0.33]} rotationY={-Math.PI / 2} kind="visit" />

      {/* wave -> transcript -> structure */}
      <instancedMesh ref={blocksRef} args={[undefined, undefined, N]} material={blockMat}>
        <boxGeometry args={[0.0035, 0.011, 0.005]} />
      </instancedMesh>

      {/* structured cluster labels */}
      {layouts.centers.map((c, i) => (
        <mesh key={i} position={[c[0] - 0.02, c[1] - 0.028, c[2]]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.055, 0.014]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) labelMats.current[i] = m
            }}
            map={labelData[i].texture}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
