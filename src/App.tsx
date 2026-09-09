import { useCallback, useEffect, useState } from 'react'
import { Nav } from './ui/Nav'
import { Journey } from './scroll/JourneySection'
import { StaticJourney } from './ui/StaticJourney'
import { Conversion, Footer } from './ui/Sections'
import { DemoDialog, WaitlistDialog } from './ui/forms/FormDialogs'
import {
  useIsMobile,
  usePrefersReducedMotion,
  useQuality,
  checkWebGL2,
} from './hooks/useMediaFlags'
import { misc } from './content/copy'
import { hideBoot } from './lib/boot'
import type { SceneFailure } from './lib/sceneFailure'

type Dialog = 'demo' | 'waitlist' | null

/** nav targets, expressed as journey progress on the cinematic path */
const NAV_PROGRESS: Record<string, number> = {
  product: 0.44,
  vision: 0.8,
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion()
  const [webgl, setWebgl] = useState(checkWebGL2)
  const mobile = useIsMobile()
  const quality = useQuality()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [failure, setFailure] = useState<SceneFailure | null>(null)
  const [attempts, setAttempts] = useState(0)
  const onSceneError = useCallback((stage: SceneFailure) => setFailure(stage), [])
  const [choice, setChoice] = useState<'static' | '3d' | null>(null)
  const forced = new URLSearchParams(window.location.search).has('static')
  const staticMode = !webgl || failure !== null || choice === 'static' ||
    (choice !== '3d' && (forced || reducedMotion))
  const enable3D = () => {
    const recovery = failure !== null || !webgl
    if (recovery && attempts >= 2) return
    if (recovery) setAttempts((n) => n + 1)
    const supported = checkWebGL2()
    setWebgl(supported)
    if (!supported) {
      setFailure('no-webgl2')
      return
    }
    const url = new URL(window.location.href)
    url.searchParams.delete('static')
    window.history.replaceState(window.history.state, '', url)
    setChoice('3d')
    setFailure(null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  useEffect(() => {
    if (staticMode) hideBoot()
  }, [staticMode])

  useEffect(() => {
    if (failure) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [failure])

  const navigate = (target: string) => {
    const behavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth'
    if (target === 'top') {
      window.scrollTo({ top: 0, behavior })
      return
    }
    if (target === 'contact') {
      document.getElementById('contact')?.scrollIntoView({ behavior })
      return
    }
    if (staticMode) {
      document.getElementById(target)?.scrollIntoView({ behavior })
      return
    }
    const journey = document.querySelector<HTMLElement>('.journey')
    const p = NAV_PROGRESS[target]
    if (journey && p !== undefined) {
      const total = journey.offsetHeight - window.innerHeight
      window.scrollTo({ top: journey.offsetTop + p * total, behavior })
    }
  }

  return (
    <>
      <a className="skip-to-content" href="#contact">
        {misc.skipToContent}
      </a>
      <Nav onNavigate={navigate} onBookDemo={() => setDialog('demo')} />
      <main>
        {staticMode ? (
          <StaticJourney
            reason={failure ?? (!webgl ? 'no-webgl2' : forced || choice === 'static' ? 'explicit-static' : 'reduced-motion')}
            onEnable3D={webgl && !failure ? enable3D : undefined}
            onRetry={(!webgl || failure) && attempts < 2 ? enable3D : undefined}
            attempts={attempts}
            onBookDemo={() => setDialog('demo')}
            onWaitlist={() => setDialog('waitlist')}
          />
        ) : (
          <Journey
            quality={attempts > 0 ? { tier: 'low', dpr: [1, 1], shadows: false } : quality}
            mobile={mobile}
            onError={onSceneError}
            onBookDemo={() => setDialog('demo')}
            onWaitlist={() => setDialog('waitlist')}
          />
        )}
        <Conversion onBookDemo={() => setDialog('demo')} onWaitlist={() => setDialog('waitlist')} />
      </main>
      {!staticMode && <button className="view-static" data-action="view-static" onClick={() => setChoice('static')}>View without motion</button>}
      <Footer onNavigate={navigate} />
      {dialog === 'demo' && <DemoDialog onClose={() => setDialog(null)} />}
      {dialog === 'waitlist' && <WaitlistDialog onClose={() => setDialog(null)} />}
    </>
  )
}
