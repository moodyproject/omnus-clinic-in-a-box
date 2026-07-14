import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { journeyState, smoothedState, insideFactor, swin } from '../scroll/journey'
import { KEYS_DESKTOP, KEYS_MOBILE, samplePath } from './paths'
import { damp, dampV3 } from '../lib/math'

interface Props {
  mobile: boolean
  reducedMotion?: boolean
}

/**
 * the only writer of camera state. reads normalized scroll progress from
 * journeyState (written by ScrollTrigger), smooths it, samples the keyframed
 * path, adds a whisper of pointer parallax outside the device, and damps the
 * camera toward the target so fast scrolling stays composed.
 */
export function CameraRig({ mobile, reducedMotion = false }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  const state = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      fov: 35,
      targetPos: new THREE.Vector3(),
      targetLook: new THREE.Vector3(),
      pointer: new THREE.Vector2(),
      pointerSmooth: new THREE.Vector2(),
      initialized: false,
    }),
    [],
  )

  useEffect(() => {
    if (mobile || reducedMotion) return
    const onMove = (e: PointerEvent) => {
      state.pointer.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      )
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [mobile, reducedMotion, state])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)

    // smooth the scroll progress itself so the whole scene shares one motion
    if (journeyState.snap || !state.initialized) {
      smoothedState.p = journeyState.p
      journeyState.snap = false
    } else {
      smoothedState.p = damp(smoothedState.p, journeyState.p, 7.5, dt)
    }
    const p = smoothedState.p

    const keys = mobile ? KEYS_MOBILE : KEYS_DESKTOP
    const targetFov = samplePath(keys, p, state.targetPos, state.targetLook)

    // pointer parallax, strongest in the studio, faint inside the clinic
    const exterior = 1 - insideFactor(p)
    state.pointerSmooth.x = damp(state.pointerSmooth.x, state.pointer.x, 3, dt)
    state.pointerSmooth.y = damp(state.pointerSmooth.y, state.pointer.y, 3, dt)
    const strength = 0.02 + 0.06 * exterior
    state.targetPos.x += state.pointerSmooth.x * strength
    state.targetPos.y -= state.pointerSmooth.y * strength * 0.6
    state.targetLook.x += state.pointerSmooth.x * strength * 0.35

    if (!state.initialized) {
      state.pos.copy(state.targetPos)
      state.look.copy(state.targetLook)
      state.fov = targetFov
      state.initialized = true
    } else {
      dampV3(state.pos, state.targetPos, 5.5, dt)
      dampV3(state.look, state.targetLook, 5.5, dt)
      state.fov = damp(state.fov, targetFov, 5.5, dt)
    }

    // when looking straight down at the floor plan, blend the up vector
    // toward -z so the overhead view stays roll-free and axis aligned
    const overhead = swin(p, 0.77, 0.82) * (1 - swin(p, 0.895, 0.94))
    camera.up.set(0, 1 - overhead, -overhead).normalize()

    camera.position.copy(state.pos)
    camera.lookAt(state.look)
    if (Math.abs(camera.fov - state.fov) > 0.01) {
      camera.fov = state.fov
      camera.updateProjectionMatrix()
    }
  }, -10)

  return null
}
