import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  title: string
  intro?: string
  onClose: () => void
  children: ReactNode
  labelId: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * accessible modal: focus trap, escape to close, focus restoration to the
 * opener, and click-outside dismissal. rendered in a portal above everything.
 */
export function Modal({ title, intro, onClose, children, labelId }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null
    const card = cardRef.current
    if (!card) return

    // move focus to the first field
    const focusables = card.querySelectorAll<HTMLElement>(FOCUSABLE)
    ;(focusables[1] ?? focusables[0])?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      restoreRef.current?.focus()
    }
  }, [onClose])

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        ref={cardRef}
      >
        <div className="modal-head">
          <h2 className="modal-title" id={labelId}>
            {title}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="close dialog">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>
        {intro && <p className="modal-intro">{intro}</p>}
        {children}
      </div>
    </div>,
    document.body,
  )
}
