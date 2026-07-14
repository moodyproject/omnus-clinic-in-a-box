import { useEffect, useState } from 'react'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 900px)')
}

export interface Quality {
  tier: 'high' | 'low'
  dpr: [number, number]
  shadows: boolean
}

export function useQuality(): Quality {
  const isMobile = useIsMobile()
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const lowPower = isMobile || (deviceMemory !== undefined && deviceMemory <= 4)
  if (lowPower) {
    return { tier: 'low', dpr: [1, 1.5], shadows: false }
  }
  return { tier: 'high', dpr: [1, 2], shadows: true }
}

export function useWebGLSupport(): boolean {
  const [supported] = useState(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
      return gl !== null
    } catch {
      return false
    }
  })
  return supported
}
