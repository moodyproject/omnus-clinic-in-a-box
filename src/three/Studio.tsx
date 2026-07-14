import * as THREE from 'three'
import { Environment, Lightformer } from '@react-three/drei'
import type { Quality } from '../hooks/useMediaFlags'

/**
 * a warm, silent product studio: porcelain ground, soft architectural light,
 * and a fully procedural environment map (no external hdris).
 */
export function Studio({ quality }: { quality: Quality }) {
  return (
    <>
      <color attach="background" args={['#f5f3ed']} />
      <fog attach="fog" args={['#f5f3ed', 7.5, 24]} />

      <hemisphereLight args={['#fbfaf7', '#d8d4c8', 0.75]} />
      <directionalLight
        position={[3.6, 5.4, 3.2]}
        intensity={1.35}
        castShadow={quality.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2.6}
        shadow-camera-right={2.6}
        shadow-camera-top={2.6}
        shadow-camera-bottom={-2.6}
        shadow-camera-near={1}
        shadow-camera-far={14}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[-4.2, 2.4, -2.4]} intensity={0.32} />

      <Environment frames={1} resolution={128}>
        {/* a white cyc studio: soft enclosure plus three broad sources,
            so anodized surfaces pick up a believable vertical gradient */}
        <mesh scale={18}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#8f8c85" side={THREE.BackSide} />
        </mesh>
        <Lightformer
          intensity={2.2}
          rotation-x={-Math.PI / 2}
          position={[0, 5, 0]}
          scale={[10, 10, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1.4}
          rotation-y={Math.PI / 2}
          position={[-5, 2.2, 0]}
          scale={[7, 4, 1]}
          color="#fbfaf7"
        />
        <Lightformer
          intensity={1.0}
          rotation-y={-Math.PI / 2}
          position={[5, 2, -1]}
          scale={[6, 3.5, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={0.9}
          rotation-y={Math.PI}
          position={[0, 1.4, 5]}
          scale={[8, 2.6, 1]}
          color="#fbfaf7"
        />
      </Environment>

      {/* studio floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#edeae2" roughness={0.96} metalness={0} />
      </mesh>
    </>
  )
}
