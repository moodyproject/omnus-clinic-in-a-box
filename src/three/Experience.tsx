import { Component, useEffect, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Studio } from './Studio'
import { Appliance } from './appliance/Appliance'
import { AcceptedClinic } from './clinic/AcceptedClinic'
import { CameraRig } from './CameraRig'
import type { Quality } from '../hooks/useMediaFlags'

/**
 * fires onReady once the scene graph is mounted, and (dev only) exposes a
 * manual frame driver so hidden/headless tabs, where requestAnimationFrame
 * is throttled to zero, can still render frames for qa screenshots.
 */
function SceneDriver({ onReady, onError }: { onReady?: () => void; onError: () => void }) {
  const advance = useThree((s) => s.advance)
  const get = useThree((s) => s.get)
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onError() }
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => gl.domElement.removeEventListener('webglcontextlost', lost)
  }, [gl, onError])

  useEffect(() => {
    onReady?.()
    if (!import.meta.env.DEV) return
    const w = window as unknown as Record<string, unknown>
    w.__omnus = get()
    w.__omnusAdvance = () => advance(performance.now())
    let interval: number | undefined
    const syncHidden = () => {
      if (document.hidden && interval === undefined) {
        interval = window.setInterval(() => advance(performance.now()), 500)
      } else if (!document.hidden && interval !== undefined) {
        window.clearInterval(interval)
        interval = undefined
      }
    }
    syncHidden()
    document.addEventListener('visibilitychange', syncHidden)
    return () => {
      if (interval !== undefined) window.clearInterval(interval)
      document.removeEventListener('visibilitychange', syncHidden)
      delete w.__omnus
      delete w.__omnusAdvance
    }
  }, [advance, get, onReady])

  return null
}

interface Props {
  quality: Quality
  mobile: boolean
  active: boolean
  onReady?: () => void
  onError: () => void
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

/**
 * the pinned webgl scene. rendering pauses (frameloop "never") whenever the
 * journey is off-screen or the tab is hidden.
 */
export function Experience({ quality, mobile, active, onReady, onError }: Props) {
  return (
    <div className="journey-canvas" aria-hidden="true">
      <SceneBoundary onError={onError}>
      <Canvas
        dpr={quality.dpr}
        shadows={quality.shadows}
        frameloop={active ? 'always' : 'never'}
        camera={{ fov: 35, near: 0.008, far: 60, position: [2.75, 1.35, 3.55] }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          // keeps the last frame available to the compositor, so background
          // tabs and headless captures always show a rendered frame
          preserveDrawingBuffer: true,
        }}
      >
        <Studio quality={quality} />
        <Appliance quality={quality} mobile={mobile} />
        <AcceptedClinic onError={onError} />
        <CameraRig mobile={mobile} />
        <SceneDriver onReady={onReady} onError={onError} />
      </Canvas>
      </SceneBoundary>
    </div>
  )
}
