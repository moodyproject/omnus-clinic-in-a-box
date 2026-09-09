import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { journeyState, smoothedState, insideFactor, swin, SCENES } from '../scroll/journey'
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
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)

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
      top: 100,
      offsetY: 0,
      copyHeights: {} as Record<string, number>,
    }),
    [],
  )

  useEffect(() => {
    if (!mobile) return
    const blocks = Array.from(document.querySelectorAll<HTMLElement>('.copy-block'))
    const controls = Array.from(document.querySelectorAll<HTMLElement>('.nav'))
    const measure = () => {
      state.top = Math.max(0, ...controls.map(el => el.getBoundingClientRect().bottom)) + 12
      for (const block of blocks) state.copyHeights[block.dataset.scene!] = block.offsetHeight
      invalidate()
    }
    const observer = new ResizeObserver(measure)
    for (const element of [...blocks, ...controls]) observer.observe(element)
    measure()
    return () => observer.disconnect()
  }, [mobile, state, invalidate])

  useEffect(() => {
    if (mobile || reducedMotion) return
    const onMove = (e: PointerEvent) => {
      state.pointer.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      )
      invalidate()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [mobile, reducedMotion, state, invalidate])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)

    // smooth the scroll progress itself so the whole scene shares one motion
    if (reducedMotion) {
      // Keep the actual canvas, but change rooms in discrete existing poses.
      // Shared progress also holds the authored actors, walls and appliance.
      const range = Object.values(SCENES).find(({ b }) => journeyState.p <= b) ?? SCENES.reveal
      smoothedState.p = (range.a + range.b) / 2
      journeyState.snap = false
    } else if (journeyState.snap || !state.initialized) {
      smoothedState.p = journeyState.p
      journeyState.snap = false
    } else {
      smoothedState.p = damp(smoothedState.p, journeyState.p, 7.5, dt)
      if (Math.abs(smoothedState.p - journeyState.p) < 1e-8) smoothedState.p = journeyState.p
    }
    const p = smoothedState.p
    let offsetPending = false

    const keys = mobile ? KEYS_MOBILE : KEYS_DESKTOP
    let targetFov = samplePath(keys, p, state.targetPos, state.targetLook)
    if (mobile) {
      // Preserve the designed horizontal field at any phone aspect ratio.
      const aspect = size.width / size.height
      const roomFov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(targetFov / 2)) * (390 / 844) / aspect)
      const overview = swin(p, 0.74, 0.79) * (1 - swin(p, 0.85, 0.895))
      // Fit the 1.36-unit chassis plus balanced margins, not desktop's
      // deliberately asymmetric editorial composition.
      const fitFov = 2 * Math.atan(1.52 / (2 * state.targetPos.distanceTo(state.targetLook) * aspect))
      targetFov = THREE.MathUtils.radToDeg(THREE.MathUtils.lerp(roomFov, fitFov, overview))
      const scene = Object.entries(SCENES).find(([, range]) => p >= range.a && p <= range.b)?.[0] ?? 'object'
      const bottom = size.height - (state.copyHeights[scene] ?? 250)
      const center = (state.top + Math.max(state.top, bottom)) / 2
      const offset = size.height / 2 - center
      state.offsetY = state.initialized && !reducedMotion ? damp(state.offsetY, offset, 7.5, dt) : offset
      offsetPending = Math.abs(state.offsetY - offset) > 0.01
      if (!offsetPending) state.offsetY = offset
      camera.setViewOffset(size.width, size.height, 0, state.offsetY, size.width, size.height)
    } else if (camera.view?.enabled) camera.clearViewOffset()

    // pointer parallax, strongest in the studio, faint inside the clinic
    const exterior = 1 - insideFactor(p)
    state.pointerSmooth.x = damp(state.pointerSmooth.x, state.pointer.x, 3, dt)
    state.pointerSmooth.y = damp(state.pointerSmooth.y, state.pointer.y, 3, dt)
    const strength = mobile || reducedMotion ? 0 : 0.02 + 0.06 * exterior
    state.targetPos.x += state.pointerSmooth.x * strength
    state.targetPos.y -= state.pointerSmooth.y * strength * 0.6
    state.targetLook.x += state.pointerSmooth.x * strength * 0.35

    if (!state.initialized || reducedMotion) {
      state.pos.copy(state.targetPos)
      state.look.copy(state.targetLook)
      state.fov = targetFov
      state.initialized = true
    } else {
      dampV3(state.pos, state.targetPos, 5.5, dt)
      dampV3(state.look, state.targetLook, 5.5, dt)
      state.fov = damp(state.fov, targetFov, 5.5, dt)
    }

    // Demand mode must finish every damping layer, not just progress. Once
    // below subpixel tolerances, land exactly and stop scheduling frames.
    const pending = !reducedMotion && (
      smoothedState.p !== journeyState.p || offsetPending ||
      state.pos.distanceToSquared(state.targetPos) > 1e-10 ||
      state.look.distanceToSquared(state.targetLook) > 1e-10 ||
      Math.abs(state.fov - targetFov) > 0.001 ||
      (!mobile && state.pointerSmooth.distanceToSquared(state.pointer) > 1e-8)
    )
    if (pending) invalidate()
    else {
      state.pos.copy(state.targetPos)
      state.look.copy(state.targetLook)
      state.fov = targetFov
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
