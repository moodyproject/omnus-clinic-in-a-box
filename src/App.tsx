import { useEffect, useMemo, useState } from 'react'
import { Nav } from './ui/Nav'
import { Journey } from './scroll/JourneySection'
import { StaticJourney } from './ui/StaticJourney'
import { Conversion, Footer } from './ui/Sections'
import { DemoDialog, WaitlistDialog } from './ui/forms/FormDialogs'
import {
  useIsMobile,
  usePrefersReducedMotion,
  useQuality,
  useWebGLSupport,
} from './hooks/useMediaFlags'
import { misc } from './content/copy'
import { hideBoot } from './lib/boot'

type Dialog = 'demo' | 'waitlist' | null

/** nav targets, expressed as journey progress on the cinematic path */
const NAV_PROGRESS: Record<string, number> = {
  product: 0.44,
  vision: 0.8,
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion()
  const webgl = useWebGLSupport()
  const mobile = useIsMobile()
  const quality = useQuality()
  const [dialog, setDialog] = useState<Dialog>(null)

  const staticMode = useMemo(() => {
    const forced = new URLSearchParams(window.location.search).has('static')
    return forced || reducedMotion || !webgl
  }, [reducedMotion, webgl])

  useEffect(() => {
    if (staticMode) hideBoot()
  }, [staticMode])

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
            reason={webgl ? 'reduced-motion' : 'no-webgl'}
            onBookDemo={() => setDialog('demo')}
            onWaitlist={() => setDialog('waitlist')}
          />
        ) : (
          <Journey
            quality={quality}
            mobile={mobile}
            onBookDemo={() => setDialog('demo')}
            onWaitlist={() => setDialog('waitlist')}
          />
        )}
        <Conversion onBookDemo={() => setDialog('demo')} onWaitlist={() => setDialog('waitlist')} />
      </main>
      <Footer onNavigate={navigate} />
      {dialog === 'demo' && <DemoDialog onClose={() => setDialog(null)} />}
      {dialog === 'waitlist' && <WaitlistDialog onClose={() => setDialog(null)} />}
    </>
  )
}
