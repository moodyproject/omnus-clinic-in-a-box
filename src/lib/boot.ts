/** fade out the pre-react loading state defined in index.html */
export function hideBoot() {
  // Retry may have re-armed the gate after the original overlay was removed.
  ;(window as unknown as { __releaseScrollGate?: () => void }).__releaseScrollGate?.()
  const el = document.getElementById('boot')
  if (!el || el.classList.contains('boot-done')) return
  el.classList.add('boot-done')
  window.setTimeout(() => el.remove(), 650)
}
