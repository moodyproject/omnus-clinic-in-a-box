import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scenes, actions, type SceneCopy } from '../content/copy'
import { SCENES, POSE } from '../scroll/journey'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  journeyEl: React.RefObject<HTMLElement | null>
  onBookDemo: () => void
  onWaitlist: () => void
}

function CopyBlock({
  scene,
  onBookDemo,
  onWaitlist,
}: {
  scene: SceneCopy
  onBookDemo: () => void
  onWaitlist: () => void
}) {
  const Heading = scene.headingLevel === 1 ? 'h1' : 'h2'
  // interior scenes get a soft porcelain scrim so copy stays readable over
  // whatever the camera frames; the studio scenes stay bare
  const scrim = scene.id !== 'object' && scene.id !== 'reveal'
  return (
    <div
      className="copy-block"
      data-scene={scene.id}
      data-side={scene.side}
      data-scrim={scrim || undefined}
    >
      <div className="copy-inner">
        {scene.stateLabel && (
          <span className="state-chip" data-state={scene.stateLabel}>
            <span className="dot" aria-hidden="true" />
            {scene.stateLabel}
          </span>
        )}
        {scene.eyebrow && <span className="eyebrow">{scene.eyebrow}</span>}
        <Heading className="copy-heading">{scene.heading}</Heading>
        <p className="copy-body">{scene.body}</p>
        {scene.actions && (
          <div className="copy-actions">
            <button className="btn btn-primary" onClick={onBookDemo}>
              {actions.primary}
            </button>
            <button className="btn btn-secondary" onClick={onWaitlist}>
              {actions.secondary}
            </button>
          </div>
        )}
        {scene.status && <p className="copy-status">{scene.status}</p>}
      </div>
    </div>
  )
}

/**
 * dom copy for the eight scenes, choreographed by one scrubbed gsap timeline
 * that maps 1:1 onto normalized journey progress. gsap only ever touches dom
 * nodes here, never the three.js scene graph.
 */
export function JourneyCopy({ journeyEl, onBookDemo, onWaitlist }: Props) {
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = layerRef.current
    const journey = journeyEl.current
    if (!layer || !journey) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline(
        POSE !== null
          ? { defaults: { ease: 'none' }, paused: true }
          : {
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: journey,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.25,
              },
            },
      )

      for (const scene of scenes) {
        const el = layer.querySelector<HTMLElement>(`[data-scene="${scene.id}"]`)
        if (!el) continue
        const { a, b } = SCENES[scene.id]
        const span = b - a
        const fadeIn = Math.min(0.035, span * 0.3)
        const fadeOut = Math.min(0.035, span * 0.3)

        if (scene.id === 'object') {
          gsap.set(el, { autoAlpha: 1, y: 0 })
          tl.to(el, { autoAlpha: 0, y: -26, duration: fadeOut }, b - span * 0.35)
        } else if (scene.id === 'reveal') {
          tl.fromTo(
            el,
            { autoAlpha: 0, y: 30 },
            { autoAlpha: 1, y: 0, duration: fadeIn * 1.6 },
            a + span * 0.45,
          )
        } else {
          tl.fromTo(
            el,
            { autoAlpha: 0, y: 26 },
            { autoAlpha: 1, y: 0, duration: fadeIn },
            a + span * 0.12,
          )
          tl.to(el, { autoAlpha: 0, y: -22, duration: fadeOut }, b - span * 0.16)
        }
      }

      if (POSE !== null) {
        tl.time(POSE, false)
      }
    }, layer)

    return () => ctx.revert()
  }, [journeyEl])

  return (
    <div className="copy-layer" ref={layerRef}>
      {scenes.map((scene) => (
        <CopyBlock key={scene.id} scene={scene} onBookDemo={onBookDemo} onWaitlist={onWaitlist} />
      ))}
    </div>
  )
}
