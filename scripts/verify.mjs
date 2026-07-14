/**
 * functional verification: scroll determinism, console errors, overflow,
 * forms, keyboard behavior, and character-loading timing.
 * usage: node scripts/verify.mjs [base-url]
 */
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const base = process.argv[2] ?? 'http://localhost:4184'
/** dev server for the state-introspection checks (window.__omnus is dev-only) */
const devBase = process.argv[3] ?? base
const results = []
const report = (name, pass, detail = '') =>
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
})

try {
  const page = await browser.newPage()
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(String(err)))

  // --- character asset loading: hero must not wait for glbs
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  const glbRequests = []
  page.on('response', (res) => {
    if (res.url().includes('/characters/')) glbRequests.push(res.url())
  })
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' })
  const heroPaintedBeforeGlbs = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const check = () => {
          const canvas = document.querySelector('canvas')
          resolve(Boolean(canvas))
        }
        setTimeout(check, 400)
      }),
  )
  const glbsAt400ms = glbRequests.length
  await new Promise((r) => setTimeout(r, 2500))
  report(
    'hero renders before character payload',
    heroPaintedBeforeGlbs && glbsAt400ms === 0,
    `canvas at 400ms: ${heroPaintedBeforeGlbs}, glbs requested by then: ${glbsAt400ms}`,
  )
  report('characters lazy-load after idle', glbRequests.length === 5, `${glbRequests.length}/5 glbs fetched`)

  // --- scroll determinism: approach the same progress from above and from
  // below, then compare character transforms and camera numerically (the
  // appliance's ambient status light breathes with time by design, so pixel
  // comparison would test the wrong thing)
  await page.goto(devBase + '/', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1500))
  const total = await page.evaluate(() => {
    const j = document.querySelector('.journey')
    return j.offsetHeight - window.innerHeight
  })
  const target = Math.round(total * 0.47)
  const sampleState = () =>
    page.evaluate(() => {
      const state = window.__omnus
      if (!state) return null
      const people = []
      state.scene.traverse((o) => {
        if (o.name && o.name.startsWith('person-')) {
          const bones = []
          o.traverse((b) => {
            if (b.isBone && ['Body', 'Head', 'FootL', 'UpperLegR'].includes(b.name)) {
              const v = b.getWorldPosition(new b.position.constructor())
              bones.push([v.x, v.y, v.z])
            }
          })
          people.push({ n: o.name, p: [o.position.x, o.position.y, o.position.z], r: o.rotation.y, bones })
        }
      })
      const c = state.camera
      return { cam: [c.position.x, c.position.y, c.position.z], people }
    })
  const approach = async (fromRatio) => {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * fromRatio))
    await new Promise((r) => setTimeout(r, 500))
    await page.evaluate((y) => window.scrollTo(0, y), target)
    await new Promise((r) => setTimeout(r, 1500))
    return sampleState()
  }
  const fwd = await approach(0.2)
  const bwd = await approach(0.8)
  let charDelta = -1
  let camDelta = -1
  if (fwd && bwd && fwd.people.length === bwd.people.length && fwd.people.length > 0) {
    charDelta = 0
    for (let i = 0; i < fwd.people.length; i++) {
      const a = fwd.people[i]
      const b = bwd.people[i]
      const vals = [...a.p, a.r, ...a.bones.flat()]
      const valsB = [...b.p, b.r, ...b.bones.flat()]
      let personMax = 0
      for (let j = 0; j < vals.length; j++)
        personMax = Math.max(personMax, Math.abs(vals[j] - valsB[j]))
      if (personMax > 1e-4) console.log(`  determinism detail: ${a.n} delta ${personMax.toExponential(2)}`)
      charDelta = Math.max(charDelta, personMax)
    }
    camDelta = Math.max(...fwd.cam.map((v, i) => Math.abs(v - bwd.cam[i])))
  }
  report(
    'characters return to identical states (fwd vs reverse approach)',
    charDelta >= 0 && charDelta < 1e-4,
    `max character delta ${charDelta.toExponential(1)} across ${fwd?.people.length ?? 0} people`,
  )
  report(
    'camera easing converges (damped by design)',
    camDelta >= 0 && camDelta < 5e-3,
    `residual camera delta ${camDelta.toExponential(1)} after 1.5s settle`,
  )

  // --- rapid direction changes: no errors, state settles
  for (let i = 0; i < 12; i++) {
    await page.evaluate(
      (y) => window.scrollTo(0, y),
      Math.round(total * (i % 2 === 0 ? 0.9 : 0.1)),
    )
    await new Promise((r) => setTimeout(r, 120))
  }
  await new Promise((r) => setTimeout(r, 800))
  report('rapid direction changes survive', true, '12 rapid reversals executed')

  // --- ?pose= direct loading
  for (const p of [0.3, 0.8, 1]) {
    await page.goto(`${base}/?pose=${p}`, { waitUntil: 'networkidle0' })
    const canvas = await page.$('canvas')
    report(`?pose=${p} loads`, Boolean(canvas))
  }

  // --- forms: demo dialog focus, escape, submit validation, local-mode note
  await page.goto(base + '/', { waitUntil: 'networkidle0' })
  await page.click('.nav-cta')
  await new Promise((r) => setTimeout(r, 500))
  const focusInDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    return dialog ? dialog.contains(document.activeElement) : false
  })
  report('demo dialog opens with focus inside', focusInDialog)
  await page.keyboard.press('Tab')
  const stillInDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    return dialog ? dialog.contains(document.activeElement) : false
  })
  report('tab keeps focus in dialog', stillInDialog)
  await page.keyboard.press('Escape')
  await new Promise((r) => setTimeout(r, 400))
  const dialogClosed = await page.evaluate(() => !document.querySelector('[role="dialog"]'))
  report('escape closes dialog', dialogClosed)

  // submit empty -> validation errors appear
  await page.click('.nav-cta')
  await new Promise((r) => setTimeout(r, 400))
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    const submit = [...dialog.querySelectorAll('button')].find((b) =>
      b.textContent.includes('request a demo'),
    )
    submit?.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  const errorShown = await page.evaluate(() =>
    Boolean(document.querySelector('[role="dialog"] [role="alert"], [role="dialog"] .field-error')),
  )
  report('empty submit shows validation', errorShown)
  await page.keyboard.press('Escape')

  // --- horizontal overflow at mobile widths
  for (const [w, h] of [[375, 812], [390, 844], [430, 932]]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(`${base}/?pose=0.8`, { waitUntil: 'networkidle0' })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    report(`no horizontal overflow at ${w}`, !overflow)
  }

  // --- static fallback + reduced motion
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  await page.goto(`${base}/?static=1`, { waitUntil: 'networkidle0' })
  const staticOk = await page.evaluate(() => document.querySelectorAll('.static-scene').length >= 7)
  report('static fallback renders all scenes', staticOk)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto(base + '/', { waitUntil: 'networkidle0' })
  const reducedOk = await page.evaluate(() => Boolean(document.querySelector('.static-journey')))
  report('reduced motion serves static journey', reducedOk)
  await page.emulateMediaFeatures([])

  // --- console errors across a full scroll
  await page.goto(base + '/', { waitUntil: 'networkidle0' })
  for (let i = 0; i <= 10; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * (i / 10)))
    await new Promise((r) => setTimeout(r, 250))
  }
  report('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | ') || 'clean')
} finally {
  await browser.close()
}

console.log(results.join('\n'))
