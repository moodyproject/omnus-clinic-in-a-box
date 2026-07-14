/** fade out the pre-react loading state defined in index.html */
export function hideBoot() {
  const el = document.getElementById('boot')
  if (!el || el.classList.contains('boot-done')) return
  el.classList.add('boot-done')
  window.setTimeout(() => el.remove(), 650)
}
