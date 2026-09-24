import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CLINIC } from '../constants'
import { smoothedState, shellOpen, swin } from '../../scroll/journey'
import { createWallCutaway, disposeModel, loadAcceptedModel } from './acceptedModel'
import { createAcceptedMotion } from './acceptedMotion'
import type { SceneFailure } from '../../lib/sceneFailure'

/** The accepted scene replaces the entire procedural clinic/people subtree. */
export function AcceptedClinic({ onError, onReady }: { onError: (stage: SceneFailure) => void; onReady?: () => void }) {
  const invalidate = useThree(s => s.invalidate)
  const gl = useThree(s => s.gl)
  const scene = useThree(s => s.scene)
  const camera = useThree(s => s.camera)
  const mount = useRef<THREE.Group>(null)
  const update = useRef<((cut: number) => void) | null>(null)
  const motion = useRef<ReturnType<typeof createAcceptedMotion> | null>(null)

  useEffect(() => {
    let cancelled = false
    let model: THREE.Group | undefined
    const controller = new AbortController()
    let readyFrame = 0
    const parent = mount.current
    const timeout = window.setTimeout(() => { if (!cancelled) { controller.abort(); onError('asset-timeout') } }, 45000)
    void loadAcceptedModel(import.meta.env.BASE_URL, controller.signal).then((loaded) => {
      window.clearTimeout(timeout)
      if (cancelled) { disposeModel(loaded); return }
      model = loaded
      model.position.y = CLINIC.floorY
      parent?.add(model)
      update.current = createWallCutaway(model)
      motion.current = createAcceptedMotion(model)
      // Prepare existing materials/textures behind the loading presentation.
      // No camera, geometry, quality or authored pose is changed.
      gl.compile(model, camera, scene)
      const textures = new Set<THREE.Texture>()
      model.traverseVisible(node => {
        if (!(node instanceof THREE.Mesh)) return
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
        }
      })
      textures.forEach(texture => gl.initTexture(texture))
      // This imperative async attachment is outside React's invalidation.
      invalidate()
      readyFrame = requestAnimationFrame(() => { if (!cancelled) onReady?.() })
    }).catch(() => { window.clearTimeout(timeout); if (!cancelled && !controller.signal.aborted) onError('asset-load') })
    return () => {
      cancelled = true
      controller.abort()
      cancelAnimationFrame(readyFrame)
      window.clearTimeout(timeout)
      update.current = null
      motion.current?.dispose()
      motion.current = null
      if (model) { parent?.remove(model); disposeModel(model) }
    }
  }, [onError, onReady, invalidate, gl, scene, camera])

  useFrame(() => {
    const p = smoothedState.p
    if (mount.current) mount.current.visible = shellOpen(p) > 0.015
    // Reveal full-height architecture first, then lower all walls together
    // before the room tour. The same pure progress function closes in reverse.
    const cut = swin(p, 0.19, 0.27) * (1 - swin(p, 0.87, 0.92))
    update.current?.(Math.round(cut * 500) / 500)
    if (mount.current?.visible) motion.current?.update(p)
  })

  return <group ref={mount} visible={false} />
}
