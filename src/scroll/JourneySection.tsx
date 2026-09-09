import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Experience } from '../three/Experience'
import { JourneyCopy } from '../ui/JourneyCopy'
import { ScrollCue, SkipTour } from '../ui/Sections'
import { journeyState, JOURNEY_VH_DESKTOP, JOURNEY_VH_MOBILE, POSE } from './journey'
import type { Quality } from '../hooks/useMediaFlags'
import { hideBoot } from '../lib/boot'
import { sceneFailureNotes, type SceneFailure } from '../lib/sceneFailure'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  quality: Quality
  mobile: boolean
  reducedMotion: boolean
  failure: SceneFailure | null
  attempts: number
  onRetry: () => void
  onToggleMotion?: () => void
  onError: (stage: SceneFailure) => void
  onBookDemo: () => void
  onWaitlist: () => void
}

/**
 * the tall scroll section with the pinned canvas. native scroll only:
 * a sticky viewport plus one ScrollTrigger that writes normalized progress
 * into journeyState for the r3f loop, and drives the dom copy timeline.
 */
export function Journey({ quality, mobile, reducedMotion, failure, attempts, onRetry, onToggleMotion, onError, onBookDemo, onWaitlist }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [cueHidden, setCueHidden] = useState(false)
  const [skipHidden, setSkipHidden] = useState(false)
  const [inView, setInView] = useState(true)
  const [tabVisible, setTabVisible] = useState(!document.hidden)

  const vh = mobile ? JOURNEY_VH_MOBILE : JOURNEY_VH_DESKTOP

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    // qa pose mode: freeze the journey at a fixed progress, no scrolling
    if (POSE !== null) {
      journeyState.p = POSE
      journeyState.snap = true
      setCueHidden(POSE > 0.02)
      setSkipHidden(POSE > 0.96)
      return
    }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        journeyState.p = self.progress
        setCueHidden(self.progress > 0.02)
        setSkipHidden(self.progress > 0.96)
      },
    })

    // reloading mid-page (or arriving with ?p=) should not animate the camera
    // across the whole journey; snap it to the restored position instead.
    const params = new URLSearchParams(window.location.search)
    const pParam = params.get('p')
    if (pParam !== null) {
      const p = Math.min(1, Math.max(0, Number.parseFloat(pParam)))
      if (!Number.isNaN(p)) {
        requestAnimationFrame(() => {
          const total = el.offsetHeight - window.innerHeight
          window.scrollTo(0, el.offsetTop + p * total)
          journeyState.p = p
          journeyState.snap = true
        })
      }
    } else {
      journeyState.p = trigger.progress
      journeyState.snap = true
    }

    // dev-only qa helper: jump straight to a journey state without relying
    // on scroll events (hidden tabs may never deliver them)
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__omnusScrollTo = (p: number) => {
        const total = el.offsetHeight - window.innerHeight
        window.scrollTo(0, el.offsetTop + p * total)
        ScrollTrigger.update()
        journeyState.p = p
        journeyState.snap = true
      }
    }

    if (!mobile) return () => trigger.kill()

    // Mobile browser chrome changes layout height without a reliable window
    // resize refresh from ScrollTrigger. Observe the actual scroll owner:
    // stale end bounds otherwise put both camera and copy in the wrong room.
    let refreshFrame = 0
    let { width, height } = el.getBoundingClientRect()
    const resizeObserver = new ResizeObserver(([entry]) => {
      // The initial observer notification is not a resize. Refreshing during
      // native document restoration can reset a recovered scroll position.
      if (entry.contentRect.width === width && entry.contentRect.height === height) return
      width = entry.contentRect.width
      height = entry.contentRect.height
      cancelAnimationFrame(refreshFrame)
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    resizeObserver.observe(el)
    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(refreshFrame)
      trigger.kill()
    }
  }, [mobile])

  // pause rendering when the journey is off-screen or the tab is hidden
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    io.observe(el)
    const onVisibility = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const skip = () => {
    const target = document.getElementById('contact')
    if (target) {
      target.scrollIntoView({ behavior: 'auto', block: 'start' })
      journeyState.p = 1
      journeyState.snap = true
    }
  }

  return (
    <section
      className="journey"
      ref={sectionRef}
      style={{ height: `${vh}vh` }}
      aria-label="the omnus journey: from appliance to clinic and back"
    >
      <div className="journey-viewport" ref={viewportRef}>
        {onToggleMotion && !failure && (
          <button className="btn btn-secondary motion-preference" data-action="toggle-motion"
            aria-pressed={!reducedMotion} onClick={onToggleMotion}>
            {reducedMotion ? 'Enable full motion' : 'Use reduced motion'}
          </button>
        )}
        {failure ? (
          <div className="scene-error" role="alert" data-scene-reason={failure}>
            <p>{sceneFailureNotes[failure]}</p>
            {attempts < 2
              ? <button className="btn btn-secondary" data-action="retry-3d" onClick={onRetry}>Retry 3D ({2 - attempts} left)</button>
              : <p>Both recovery attempts have been used. Try reopening this page after checking your connection or browser graphics settings.</p>}
          </div>
        ) : <Experience
          key={attempts}
          quality={quality}
          mobile={mobile}
          reducedMotion={reducedMotion}
          active={inView && tabVisible}
          onReady={hideBoot}
          onError={onError}
        />}
        <JourneyCopy journeyEl={sectionRef} reducedMotion={reducedMotion} onBookDemo={onBookDemo} onWaitlist={onWaitlist} />
        <ScrollCue hidden={cueHidden} />
      </div>
      <SkipTour onSkip={skip} hidden={skipHidden} />
    </section>
  )
}
