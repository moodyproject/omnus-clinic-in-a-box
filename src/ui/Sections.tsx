import { actions, conversion, footer, nav, misc } from '../content/copy'
import { POSE } from '../scroll/journey'

/** pose mode freezes the page for qa captures; skip css transitions there */
const instant = POSE !== null ? ({ transition: 'none' } as const) : null

interface ConversionProps {
  onBookDemo: () => void
  onWaitlist: () => void
}

export function Conversion({ onBookDemo, onWaitlist }: ConversionProps) {
  return (
    <section className="conversion" id="contact" aria-labelledby="conversion-heading">
      <div className="conversion-inner">
        <h2 id="conversion-heading">{conversion.heading}</h2>
        <p>{conversion.body}</p>
        <div className="copy-actions">
          <button className="btn btn-primary" onClick={onBookDemo}>
            {actions.primary}
          </button>
          <button className="btn btn-secondary" onClick={onWaitlist}>
            {actions.secondary}
          </button>
        </div>
        <p className="conversion-status">{conversion.status}</p>
      </div>
    </section>
  )
}

export function Footer({ onNavigate }: { onNavigate: (target: string) => void }) {
  return (
    <footer className="footer">
      <hr className="footer-rule" />
      <div className="footer-row">
        <div className="footer-brand">
          <span className="wordmark">{misc.wordmark}</span>
          <span className="footer-line">{footer.line}</span>
        </div>
        <nav className="footer-links" aria-label="footer">
          {nav.links.map((link) => (
            <button
              key={link.target}
              className="footer-link"
              onClick={() => onNavigate(link.target)}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
      <p className="footer-fine">{footer.fine}</p>
    </footer>
  )
}

export function ScrollCue({ hidden }: { hidden: boolean }) {
  return (
    <div className="scroll-cue" style={{ opacity: hidden ? 0 : 1, ...instant }} aria-hidden="true">
      <span>{misc.scrollCue}</span>
    </div>
  )
}

export function SkipTour({ onSkip, hidden }: { onSkip: () => void; hidden: boolean }) {
  return (
    <button
      className="skip-tour"
      onClick={onSkip}
      style={hidden ? { opacity: 0, pointerEvents: 'none', ...instant } : instant ?? undefined}
      tabIndex={hidden ? -1 : 0}
    >
      {misc.skip}
    </button>
  )
}
