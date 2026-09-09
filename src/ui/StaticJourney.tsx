import { scenes, actions } from '../content/copy'
import { sceneFailureNotes, type StaticReason } from '../lib/sceneFailure'

/**
 * the same story told as accessible steps, used when the visitor prefers
 * reduced motion or webgl is unavailable. nothing is dropped: every scene's
 * copy appears in order, with the appliance drawn in css.
 */

export function DeviceIllustration() {
  return (
    <div className="device-illustration" role="img" aria-label="the omnus appliance: a compact satin gunmetal box on a dark chassis, with a fine ventilation band, a small status display, and a sage status light">
      <span className="led" />
      <span className="plate">omnus os</span>
      <span className="vents" />
    </div>
  )
}

export function StaticJourney({
  reason,
  onEnable3D,
  onRetry,
  attempts,
  onBookDemo,
  onWaitlist,
}: {
  reason: StaticReason
  onEnable3D?: () => void
  onRetry?: () => void
  attempts: number
  onBookDemo: () => void
  onWaitlist: () => void
}) {
  const hero = scenes[0]
  const rest = scenes.slice(1)

  return (
    <div className="static-journey">
      <div className="static-note" role="note" data-scene-reason={reason}>
        <p>{sceneFailureNotes[reason]}</p>
        {onEnable3D && <>
          <p>The interactive 3D clinic uses scroll-driven motion. Enable it only if you are comfortable with motion; you can return to this static story at any time.</p>
          <button className="btn btn-secondary" data-action="enable-3d" onClick={onEnable3D}>Enable interactive 3D</button>
        </>}
        {!onEnable3D && <>
          <p>Retrying enables scroll-driven motion if graphics are available. You can return to the static story at any time.</p>
          {onRetry
            ? <button className="btn btn-secondary" data-action="retry-3d" onClick={onRetry}>{reason === 'no-webgl2' ? 'Check again for 3D' : 'Retry 3D in low quality'} ({2 - attempts} left)</button>
            : <p>Both recovery attempts have been used. The full story and contact forms remain available below. Try reopening this page in Safari or Chrome after checking your connection.</p>}
        </>}
        <small data-scene-diagnostic>View: {reason}; recovery attempts: {attempts}/2. This diagnostic stays on this page.</small>
      </div>

      <section className="static-hero">
        <div>
          {hero.eyebrow && <span className="eyebrow">{hero.eyebrow}</span>}
          <h1 className="copy-heading">{hero.heading}</h1>
          <p className="copy-body">{hero.body}</p>
          <div className="copy-actions">
            <button className="btn btn-primary" onClick={onBookDemo}>
              {actions.primary}
            </button>
            <button className="btn btn-secondary" onClick={onWaitlist}>
              {actions.secondary}
            </button>
          </div>
          {hero.status && <p className="copy-status">{hero.status}</p>}
        </div>
        <DeviceIllustration />
      </section>

      <figure className="clinic-static">
        <img className="clinic-static-image" src={`${import.meta.env.BASE_URL}models/3d-redesign/clinic-static.png`} alt="Saved rendering of the four-room clinic, furnished with six seated people" />
        <figcaption>Clinic model · saved view</figcaption>
      </figure>

      {rest.map((scene, i) => (
        <section
          key={scene.id}
          className="static-scene"
          id={scene.id === 'during' ? 'product' : scene.id === 'reveal' ? 'vision' : undefined}
          aria-labelledby={`static-${scene.id}`}
        >
          <span className="step-index">
            {String(i + 1).padStart(2, '0')} / {String(rest.length).padStart(2, '0')}
          </span>
          {scene.eyebrow && <span className="eyebrow">{scene.eyebrow}</span>}
          <h2 id={`static-${scene.id}`}>{scene.heading}</h2>
          <p>{scene.body}</p>
          {scene.stateLabel && (
            <span className="state-chip" data-state={scene.stateLabel}>
              <span className="dot" aria-hidden="true" />
              {scene.stateLabel}
            </span>
          )}
          {scene.actions && (
            <div className="copy-actions">
              <button className="btn btn-primary" onClick={onBookDemo}>
                {actions.primary}
              </button>
              <button className="btn btn-secondary" onClick={onWaitlist}>
                {actions.secondary}
              </button>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
