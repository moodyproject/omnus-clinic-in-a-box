import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE_URL || 'http://127.0.0.1:4198/'
const phase = process.argv[2] || 'after'
const out = 'docs/evidence/performance-choreography'
fs.mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const wait = ms => new Promise(r => setTimeout(r, ms))
const rows = []
try {
 for (const width of [1440, 390]) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: width === 1440 ? 900 : 844, deviceScaleFactor: 1, isMobile: width < 500, hasTouch: width < 500 })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  await page.goto(base, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__omnus?.scene.getObjectByName('room-people'))
  await page.evaluate(async ({ disableCulling }) => {
   window.journey = await import('/src/scroll/journey.ts')
   const s = window.__omnus, original = s.gl.render.bind(s.gl)
   if (disableCulling) {
    const root = s.scene.getObjectByName('accepted-clinic')
    root.updateMatrixWorld = Object.getPrototypeOf(root).updateMatrixWorld
    root.traverse(n => { if (n.isSkinnedMesh) n.frustumCulled = false })
   }
   window.perf = { frames: 0, renderMs: 0, callbackThroughRenderMs: 0, normalsMs: 0, normalsCalls: 0 }
   const subscriber = s.internal.subscribers[0], callbackRef = subscriber.ref
   let frameStart = 0
   subscriber.ref = { current: (...args) => { frameStart = performance.now(); return callbackRef.current(...args) } }
   s.gl.render = (...args) => { const start = performance.now(); const result = original(...args); const end = performance.now(); window.perf.frames++; window.perf.renderMs += end - start; window.perf.callbackThroughRenderMs += end - frameStart; return result }
   const seen = new Set()
   s.scene.traverse(n => { if (!n.geometry || seen.has(n.geometry)) return; seen.add(n.geometry); const g = n.geometry, orig = g.computeVertexNormals.bind(g); g.computeVertexNormals = () => { const t = performance.now(); const result = orig(); window.perf.normalsMs += performance.now() - t; window.perf.normalsCalls++; return result } })
  }, { disableCulling: process.env.CULLING_MODE === 'off' })
  const scroll = async p => {
   await page.evaluate(p => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * p) }, p)
   await page.waitForFunction(p => Math.abs(window.journey.journeyState.p - p) < .0005 && Math.abs(window.journey.smoothedState.p - window.journey.journeyState.p) < 1e-10, { timeout: 20000 }, p)
   await wait(3000)
  }
  await scroll(.47)
  const idleStart = await page.evaluate(() => ({ ...window.perf, t: performance.now() }))
  await wait(2000)
  const idle = await page.evaluate(start => ({ frames: window.perf.frames - start.frames, renderMs: window.perf.renderMs - start.renderMs, durationMs: performance.now() - start.t }), idleStart)
  const nativeStart = await page.evaluate(() => ({ ...window.perf, t: performance.now() }))
  await page.evaluate(async () => {
   const e = document.querySelector('.journey')
   for (let i = 0; i <= 120; i++) { scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * (.18 + .65 * i / 120)); await new Promise(r => setTimeout(r, 16)) }
  })
  const native = await page.evaluate(start => ({ frames: window.perf.frames - start.frames, rendererOnlyMs: window.perf.renderMs - start.renderMs, callbackThroughRenderMs: window.perf.callbackThroughRenderMs - start.callbackThroughRenderMs, normalsMs: window.perf.normalsMs - start.normalsMs, normalsCalls: window.perf.normalsCalls - start.normalsCalls, durationMs: performance.now() - start.t }), nativeStart)
  const tailStart = await page.evaluate(() => ({ ...window.perf, t: performance.now() }))
  await page.waitForFunction(() => Math.abs(window.journey.journeyState.p - .83) < .0005 && Math.abs(window.journey.smoothedState.p - window.journey.journeyState.p) < 1e-10, { timeout: 20000 })
  await wait(100)
  const nativeDampingTail = await page.evaluate(start => ({ frames: window.perf.frames - start.frames, rendererOnlyMs: window.perf.renderMs - start.renderMs, callbackThroughRenderMs: window.perf.callbackThroughRenderMs - start.callbackThroughRenderMs, durationMs: performance.now() - start.t }), tailStart)
  await scroll(.47)
  const controlled = await page.evaluate(() => {
   const s = window.__omnus; s.setFrameloop('never')
   const frames = [], before = { ...window.perf }
   let time = s.clock.elapsedTime
   for (let i = 0; i <= 120; i++) {
    window.journey.journeyState.p = .18 + .65 * i / 120; window.journey.journeyState.snap = true
    const start = performance.now(); s.advance(time += 1 / 60); s.gl.getContext().finish(); frames.push(performance.now() - start)
   }
   const sorted = [...frames].sort((a, b) => a - b)
   return { frames: frames.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)], totalMs: frames.reduce((a,b) => a+b,0), renderMs: window.perf.renderMs - before.renderMs, normalsMs: window.perf.normalsMs - before.normalsMs, normalsCalls: window.perf.normalsCalls - before.normalsCalls, renderInfo: { ...s.gl.info.render }, context: s.gl.getContext().getContextAttributes() }
  })
  rows.push({ width, browser: await browser.version(), culling: process.env.CULLING_MODE !== 'off', metricScope: 'Native callbackThroughRenderMs starts before first useFrame (camera -10), includes mixer/wall/all callbacks and synchronous renderer submission. Excludes browser input/layout/compositor and asynchronous GPU time. rendererOnlyMs excludes useFrame. Tail recorded separately. Controlled advance includes callbacks and gl.finish, not phone FPS.', idle, native, nativeDampingTail, controlled, errors })
  fs.writeFileSync(`${out}/${phase}-performance.json`, JSON.stringify(rows, null, 2))
  console.log(JSON.stringify(rows.at(-1)))
  await page.close()
 }
 for (const row of rows) { assert.ok(row.idle.frames <= 2, `settled ${row.width}px clinic must stop rendering, got ${row.idle.frames}`); for (const part of [row.native, row.nativeDampingTail]) assert.ok(part.callbackThroughRenderMs >= part.rendererOnlyMs && part.callbackThroughRenderMs < part.durationMs, 'frame callback timer must be live and bounded by elapsed wall time'); assert.deepEqual(row.errors, []) }
} finally { await browser.close() }
