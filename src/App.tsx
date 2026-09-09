import { useCallback, useEffect, useState } from 'react'
import { Nav } from './ui/Nav'
import { Journey } from './scroll/JourneySection'
import { Conversion, Footer } from './ui/Sections'
import { DemoDialog, WaitlistDialog } from './ui/forms/FormDialogs'
import {
  useIsMobile,
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
  // Locked product contract: full scroll-driven tour on every device.
  // No visitor motion switch or OS-preference-selected still poses.
  const reducedMotion = false
  const [webgl, setWebgl] = useState(checkWebGL2)
  const mobile = useIsMobile()
  const quality = useQuality()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [failure, setFailure] = useState<SceneFailure | null>(null)
  const [attempts, setAttempts] = useState(0)
  const onSceneError = useCallback((stage: SceneFailure) => setFailure(stage), [])
  const sceneFailure = failure ?? (!webgl ? 'no-webgl2' : null)
  const retry3D = () => {
    if (!sceneFailure || attempts >= 2) return
    setAttempts((n) => n + 1)
    const supported = checkWebGL2()
    setWebgl(supported)
    if (!supported) {
      setFailure('no-webgl2')
      return
    }

    setFailure(null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  useEffect(() => {
    if (sceneFailure) hideBoot()
  }, [sceneFailure])

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
        <Journey
          quality={attempts > 0 ? { tier: 'low', dpr: [1, 1], shadows: false } : quality}
          mobile={mobile}
          reducedMotion={reducedMotion}
          failure={sceneFailure}
          attempts={attempts}
          onRetry={retry3D}
          onError={onSceneError}
          onBookDemo={() => setDialog('demo')}
          onWaitlist={() => setDialog('waitlist')}
        />
        <Conversion onBookDemo={() => setDialog('demo')} onWaitlist={() => setDialog('waitlist')} />
      </main>

      <Footer onNavigate={navigate} />
      {dialog === 'demo' && <DemoDialog onClose={() => setDialog(null)} />}
      {dialog === 'waitlist' && <WaitlistDialog onClose={() => setDialog(null)} />}
    </>
  )
}
