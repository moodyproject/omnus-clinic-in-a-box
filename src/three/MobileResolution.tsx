import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { journeyState, subscribeJourney } from '../scroll/journey'
import type { Quality } from '../hooks/useMediaFlags'

/** Lower canvas fill cost during phone scrolling; DOM text stays native-res.
 * One trailing timer restores clarity without keeping the render loop alive. */
export function MobileResolution({ mobile, active, quality }: { mobile: boolean; active: boolean; quality: Quality }) {
  const get = useThree(state => state.get)
  const setDpr = useThree(state => state.setDpr)
  const invalidate = useThree(state => state.invalidate)
  const [minimum, maximum] = quality.dpr
  useEffect(() => {
    const resting = Math.max(minimum, Math.min(window.devicePixelRatio || 1, maximum))
    const moving = Math.min(resting, 1.25)
    let timer: ReturnType<typeof setTimeout> | undefined
    const apply = (dpr: number) => {
      if (get().viewport.dpr === dpr) return
      setDpr(dpr)
      invalidate()
    }
    if (!mobile || !active) { apply(resting); return }
    const unsubscribe = subscribeJourney(() => {
      if (journeyState.snap) return
      if (timer !== undefined) clearTimeout(timer)
      apply(moving)
      timer = setTimeout(() => { timer = undefined; apply(resting) }, 220)
    })
    return () => {
      unsubscribe()
      if (timer !== undefined) clearTimeout(timer)
      apply(resting)
    }
  }, [mobile, active, minimum, maximum, get, setDpr, invalidate])
  return null
}
