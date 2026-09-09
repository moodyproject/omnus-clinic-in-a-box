import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE || '/Users/moud/.hermes/hermes-agent/package.json')
const { chromium, webkit } = require('playwright')
const base = process.env.BASE_URL || 'http://127.0.0.1:4196/'
const phase = process.env.PHASE || 'baseline'
const out = `docs/evidence/mobile-recovery/${phase}`
fs.mkdirSync(out, { recursive: true })
const results = []
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
 let browser
 try { browser = await launcher.launch({ headless: true, ...(engine === 'chromium' ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } : {}) }) }
 catch (error) { results.push({ engine, pass: false, gap: String(error) }); continue }
 try {
  for (const mode of ['normal', 'reduced', 'static', 'asset', 'no-webgl2', 'lost', 'renderer', 'exhausted', 'capability-recovery', 'timeout']) {
   if (process.env.MODES && !process.env.MODES.split(',').includes(mode)) continue
   const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' })
   const page = await context.newPage(), errors = [], requests = [], assets = new Set()
   page.on('response', r => { if (r.url().endsWith('.glb') && r.ok()) assets.add(new URL(r.url()).pathname) })
   const ready = async () => {
    if (!process.env.PRODUCTION) await page.waitForFunction(() => window.__omnus?.scene.getObjectByName('room-people'), null, { timeout: 30000 })
    else {
     await page.locator('canvas').waitFor()
     for (let n = 0; assets.size < 5 && n < 100; n++) await page.waitForTimeout(100)
     assert.equal(assets.size, 5, 'all five actual GLBs load in production')
     await page.waitForTimeout(1000)
     assert.equal(await page.locator('.static-journey').count(), 0)
    }
   }
   page.on('pageerror', e => errors.push(String(e)))
   page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
   page.on('requestfailed', r => requests.push({ url: new URL(r.url()).pathname, error: r.failure() }))
   if (['no-webgl2', 'capability-recovery'].includes(mode)) await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args) }
    window.restoreContext = () => { HTMLCanvasElement.prototype.getContext = original }
   })
   if (['asset', 'exhausted'].includes(mode)) await page.route('**/patient-seated.glb', r => r.abort())
   if (mode === 'timeout') {
    await page.addInitScript(() => { const original = window.setTimeout; window.setTimeout = (fn, delay, ...args) => original(fn, delay === 45000 ? 2000 : delay, ...args) })
    await page.route('**/patient-seated.glb', async r => { await new Promise(resolve => setTimeout(resolve, 3000)); await r.continue().catch(() => {}) })
   }
   if (mode === 'renderer') await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === 'webgl2' && this.isConnected ? null : original.call(this, type, ...args) }
    window.restoreContext = () => { HTMLCanvasElement.prototype.getContext = original }
   })
   const row = { engine, version: browser.version(), mode, errors, requests }
   try {
    await page.goto(base + (mode === 'static' ? '?static=1' : ''), { waitUntil: 'networkidle' })
    if (mode === 'lost') {
     await ready()
     await page.locator('canvas').evaluate(c => c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())
    }
    if (mode === 'normal') {
     await ready()
     if (!process.env.PRODUCTION) row.render = await page.evaluate(() => { const s = window.__omnus; return { calls: s.gl.info.render.calls, triangles: s.gl.info.render.triangles, memory: s.gl.info.memory } })
    } else await page.locator('.static-journey').waitFor()
    row.before = await page.locator('.static-note').textContent({ timeout: 500 }).catch(() => null)
    await page.screenshot({ path: `${out}/${engine}-${mode}-before.png` })
    if (mode !== 'normal') {
     const expected = { reduced: 'reduced-motion', static: 'explicit-static', asset: 'asset-load', exhausted: 'asset-load', 'no-webgl2': 'no-webgl2', 'capability-recovery': 'no-webgl2', lost: 'context-lost', renderer: 'renderer-init', timeout: 'asset-timeout' }[mode]
     assert.equal(await page.locator('[data-scene-reason]').getAttribute('data-scene-reason'), expected)
     assert.equal(await page.locator('.static-scene').count(), 7)
     assert.equal(await page.locator('#contact').count(), 1)
     if (['reduced', 'static', 'no-webgl2', 'capability-recovery'].includes(mode)) assert.equal(assets.size, 0)
     const selector = ['reduced', 'static'].includes(mode) ? '[data-action="enable-3d"]' : '[data-action="retry-3d"]'
     assert.equal(await page.locator(selector).count(), 1, `${mode} must offer explicit in-page recovery`)
     if (['asset', 'timeout'].includes(mode)) await page.unroute('**/patient-seated.glb')
     if (['renderer', 'capability-recovery'].includes(mode)) await page.evaluate(() => window.restoreContext())
     await page.locator(selector).click()
     if (['no-webgl2', 'exhausted'].includes(mode)) {
      await page.locator(`[data-scene-reason="${expected}"]`).waitFor()
      await page.locator('[data-action="retry-3d"]').click()
      await page.locator(`[data-scene-reason="${expected}"]`).waitFor()
      assert.equal(await page.locator('[data-action="retry-3d"]').count(), 0)
      await page.waitForTimeout(1000)
      assert.equal(await page.locator('canvas').count(), 0)
      assert.equal(await page.locator('.static-scene').count(), 7)
     } else {
      await ready()
      if (!process.env.PRODUCTION && !['reduced', 'static'].includes(mode)) assert.equal(await page.evaluate(() => window.__omnus.gl.getPixelRatio()), 1)
     }
     await page.screenshot({ path: `${out}/${engine}-${mode}-after.png` })
    }
    if (!['no-webgl2', 'exhausted'].includes(mode)) {
     assert.equal(await page.locator('[data-action="view-static"]').count(), 1)
     await page.locator('[data-action="view-static"]').click()
     await page.locator('[data-scene-reason="explicit-static"]').waitFor()
     assert.equal(await page.locator('canvas').count(), 0)
    }
    await page.locator('.nav-cta').click()
    await page.locator('[role="dialog"]').waitFor()
    await page.keyboard.press('Escape')
    await page.locator('[role="dialog"]').waitFor({ state: 'detached' })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    if (!['asset', 'exhausted', 'renderer'].includes(mode)) assert.deepEqual(errors, [])
    row.assets = [...assets]
    row.pass = true
   } catch (error) { row.pass = false; row.failure = String(error) }
   results.push(row); console.log(JSON.stringify(row)); fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2))
   await context.close()
  }
 } finally { await browser.close() }
}
fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2))
assert.equal(results.length, 2 * (process.env.MODES ? process.env.MODES.split(',').length : 10), 'complete requested engine/case coverage')
if (results.some(r => r.pass === false)) process.exitCode = 1
