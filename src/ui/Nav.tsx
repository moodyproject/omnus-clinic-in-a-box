import { useEffect, useState } from 'react'
import { nav, misc } from '../content/copy'
import { POSE } from '../scroll/journey'

interface Props {
  onNavigate: (target: string) => void
  onBookDemo: () => void
}

export function Nav({ onNavigate, onBookDemo }: Props) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24 || (POSE !== null && POSE > 0.02))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}`}>
      <button
        className="wordmark"
        onClick={() => onNavigate('top')}
        aria-label="omnus, back to top"
      >
        {misc.wordmark}
      </button>
      <nav className="nav-links" aria-label="primary">
        {nav.links.map((link) => (
          <button key={link.target} className="nav-link" onClick={() => onNavigate(link.target)}>
            {link.label}
          </button>
        ))}
        <button className="btn btn-primary nav-cta" onClick={onBookDemo}>
          {nav.cta}
        </button>
      </nav>
    </header>
  )
}
