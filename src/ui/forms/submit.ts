/**
 * form submission with three explicit modes:
 * - "sent": a configured same-origin endpoint accepted the payload
 * - "local": no endpoint in a dev build; the flow is exercised, nothing is sent
 * - "unconfigured": no endpoint in a production build; the user is told honestly
 *
 * form contents are never logged anywhere.
 */

export type FormKind = 'demo' | 'waitlist'

export type SubmitResult =
  | { status: 'sent' }
  | { status: 'local' }
  | { status: 'unconfigured' }
  | { status: 'error' }

function endpointFor(kind: FormKind): string | undefined {
  const value =
    kind === 'demo'
      ? (import.meta.env.VITE_DEMO_ENDPOINT as string | undefined)
      : (import.meta.env.VITE_WAITLIST_ENDPOINT as string | undefined)
  return value && value.trim() !== '' ? value : undefined
}

export async function submitForm(
  kind: FormKind,
  payload: Record<string, string>,
): Promise<SubmitResult> {
  const endpoint = endpointFor(kind)

  if (!endpoint) {
    if (import.meta.env.DEV) {
      // explicit local-only test mode for interface development
      await new Promise((r) => setTimeout(r, 650))
      return { status: 'local' }
    }
    return { status: 'unconfigured' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return res.ok ? { status: 'sent' } : { status: 'error' }
  } catch {
    return { status: 'error' }
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}
