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

export function checkWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return false
    // Three r182 requires WebGL2. Do not retain a competing probe context.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}
