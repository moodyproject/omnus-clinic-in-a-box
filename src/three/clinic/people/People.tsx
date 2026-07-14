import { useEffect, useState } from 'react'
import { journeyState } from '../../../scroll/journey'
import { Person, type PersonSpec } from './Person'
import { CAST } from './cast'

/**
 * the human layer of the clinic. mounting is deferred until the browser is
 * idle (or the visitor starts scrolling), so the closed-appliance hero never
 * waits on character downloads.
 */
export function People() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let raf = 0
    const timer = window.setTimeout(() => setReady(true), 900)
    const poll = () => {
      if (journeyState.p > 0.01) {
        setReady(true)
        return
      }
      raf = window.requestAnimationFrame(poll)
    }
    raf = window.requestAnimationFrame(poll)
    return () => {
      window.clearTimeout(timer)
      window.cancelAnimationFrame(raf)
    }
  }, [])

  if (!ready) return null
  return (
    <group>
      {CAST.map((spec: PersonSpec, i: number) => (
        <Person key={i} spec={spec} />
      ))}
    </group>
  )
}
