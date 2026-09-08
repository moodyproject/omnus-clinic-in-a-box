import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CLINIC } from '../constants'
import { smoothedState, shellOpen, swin } from '../../scroll/journey'
import { createWallCutaway, disposeModel, loadAcceptedModel } from './acceptedModel'

/** The accepted scene replaces the entire procedural clinic/people subtree. */
export function AcceptedClinic({ onError }: { onError: () => void }) {
  const mount = useRef<THREE.Group>(null)
  const update = useRef<((cut: number) => void) | null>(null)

  useEffect(() => {
    let cancelled = false
    let model: THREE.Group | undefined
    const parent = mount.current
    const timeout = window.setTimeout(() => { if (!cancelled) onError() }, 45000)
    void loadAcceptedModel(import.meta.env.BASE_URL, () => cancelled).then((loaded) => {
      window.clearTimeout(timeout)
      if (cancelled) { disposeModel(loaded); return }
      model = loaded
      model.position.y = CLINIC.floorY
      parent?.add(model)
      update.current = createWallCutaway(model)
    }).catch(() => { window.clearTimeout(timeout); if (!cancelled) onError() })
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      update.current = null
      if (model) { parent?.remove(model); disposeModel(model) }
    }
  }, [onError])

  useFrame(() => {
    const p = smoothedState.p
    if (mount.current) mount.current.visible = shellOpen(p) > 0.015
    // Reveal full-height architecture first, then lower all walls together
    // before the room tour. The same pure progress function closes in reverse.
    const cut = swin(p, 0.19, 0.27) * (1 - swin(p, 0.87, 0.92))
    update.current?.(Math.round(cut * 500) / 500)
  })

  return <group ref={mount} visible={false} />
}
