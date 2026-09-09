import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base = process.env.BASE_URL || 'http://127.0.0.1:4198/'
const out = 'docs/evidence/performance-choreography'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const wait = ms => new Promise(r => setTimeout(r, ms)), rows = []
try {
 for (const width of [1440, 390]) {
  const page = await browser.newPage(), errors = []
  page.on('pageerror', e => errors.push(String(e)))
  await page.setViewport({ width, height: width === 1440 ? 900 : 844, isMobile: width < 500, hasTouch: width < 500 })
  await page.setRequestInterception(true)
  page.on('request', r => { if (r.url().endsWith('/room-people.glb')) setTimeout(() => r.continue(), 3000); else r.continue() })
  await page.goto(base + '?p=.47', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !!window.__omnus)
  await page.evaluate(async () => { window.journey = await import('/src/scroll/journey.ts') })
  await page.waitForFunction(() => window.__omnus.get().internal.frames === 0)
  const beforeLoad = await page.evaluate(() => ({ frame: window.__omnus.gl.info.render.frame, loaded: !!window.__omnus.scene.getObjectByName('room-people') }))
  await page.waitForFunction(() => window.__omnus.scene.getObjectByName('room-people'))
  await page.waitForFunction(frame => window.__omnus.gl.info.render.frame > frame, {}, beforeLoad.frame)
  assert.equal(beforeLoad.loaded, false, 'the load must land after the initial scene is asleep')
  const settle = () => page.waitForFunction(() => window.__omnus.get().internal.frames === 0 && Math.abs(window.journey.smoothedState.p - window.journey.journeyState.p) < 1e-10, { timeout: 15000 })
  const state = () => page.evaluate(() => {
   const s = window.__omnus, bones = []; s.scene.getObjectByName('accepted-clinic').traverse(n => { if (n.isBone) bones.push(...n.position.toArray(), ...n.quaternion.toArray()) })
   return { p: window.journey.smoothedState.p, target: window.journey.journeyState.p, frame: s.gl.info.render.frame, camera: [...s.camera.position.toArray(), ...s.camera.quaternion.toArray()], projection: s.camera.projectionMatrix.toArray(), bones, loop: s.get().frameloop, overflow: document.documentElement.scrollWidth > innerWidth }
  })
  const scroll = async p => { await page.evaluate(p => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * p) }, p); await page.waitForFunction(p => Math.abs(window.journey.journeyState.p - p) < .0005, {}, p); await settle(); return state() }
  const first = await scroll(.47), held = await state(); await wait(1200); const hold = await state()
  assert.equal(hold.frame, held.frame, 'held real canvas renders no frames')
  await scroll(.82); const reverse = await scroll(.47)
  const error = Math.max(...first.bones.map((v, i) => Math.abs(v - reverse.bones[i])))
  assert.ok(error < .0001)
  await page.screenshot({ path: `${out}/native-${width}-consult.png` })
  const preResize = await state()
  await page.setViewport({ width, height: width === 1440 ? 800 : 720, isMobile: width < 500, hasTouch: width < 500 })
  await wait(500); await settle(); const resized = await state()
  assert.ok(resized.frame > preResize.frame, 'resize wakes the canvas')
  assert.notDeepEqual(resized.projection, preResize.projection)
  // The real footer can be shorter than a desktop viewport; add test-only
  // trailing space so native scrolling can move the sticky viewport fully out.
  await page.evaluate(() => { const spacer = document.createElement('div'); spacer.style.height = `${innerHeight}px`; document.body.append(spacer); scrollTo(0, document.documentElement.scrollHeight) })
  await page.waitForFunction(() => window.__omnus.get().frameloop === 'never')
  const offscreen = await state(); await wait(600); assert.equal((await state()).frame, offscreen.frame)
  const resumed = await scroll(.60); assert.equal(resumed.loop, 'demand')
  // Exercise the exact visibility callback while retaining native scroll/IO.
  // Synthetic event, NOT a claim of physical mobile app suspension coverage.
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
  await page.waitForFunction(() => window.__omnus.get().frameloop === 'never')
  await page.evaluate(() => { window.journey.journeyState.p = .7; delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
  await settle(); const visibleAgain = await state(); assert.equal(visibleAgain.p, .7)
  if (width === 1440) {
   const prior = await state(); await page.mouse.move(200, 100); await wait(100); await settle(); const pointer = await state()
   assert.ok(pointer.frame > prior.frame); assert.notDeepEqual(pointer.camera, prior.camera)
  }
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.evaluate(() => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * .45) })
  await page.waitForFunction(() => window.__omnus.get().internal.frames === 0 && Math.abs(window.journey.smoothedState.p - .45) < 1e-10)
  const reduced = await state(); await wait(800); assert.equal((await state()).frame, reduced.frame)
  await page.evaluate(() => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * .49) })
  await wait(300); const reducedSameRoom = await state(); assert.deepEqual(reducedSameRoom.bones, reduced.bones)
  await page.screenshot({ path: `${out}/reduced-${width}.png` })
  assert.equal(resumed.overflow, false); assert.deepEqual(errors, [])
  rows.push({ width, delayedLoadWake: true, idleFrames: hold.frame - held.frame, reverseError: error, resizeWake: true, offscreenPauseResume: true, syntheticVisibilityResume: true, pointerWake: width === 1440, reducedRoomHold: true, errors })
  console.log(rows.at(-1)); fs.writeFileSync(`${out}/demand-smoke.json`, JSON.stringify(rows, null, 2)); await page.close()
 }
} finally { await browser.close() }
