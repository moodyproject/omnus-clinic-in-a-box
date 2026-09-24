import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, pipe: true, timeout: 60000 })
const rows = []
try {
  const page = await browser.newPage()
  await page.evaluateOnNewDocument(() => {
    window.__roots = new Set()
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, renderers: new Map(), inject(r) { this.renderers.set(1, r); return 1 }, onCommitFiberRoot(_id, root) { window.__roots.add(root) }, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {} }
    window.__scene = () => {
      for (const root of window.__roots) {
        const stack = [root.current], seen = new Set()
        while (stack.length) {
          const f = stack.pop()
          if (!f || seen.has(f)) continue
          seen.add(f)
          const s = f.memoizedProps?.value?.getState?.()
          if (s?.scene?.getObjectByName('accepted-clinic')) return s.scene
          stack.push(f.child, f.sibling)
        }
      }
    }
  })
  await page.setViewport({ width: 390, height: 844 })
  let fail = true, delayed = false
  await page.setRequestInterception(true)
  page.on('request', r => {
    if (!r.url().endsWith('.glb')) return r.continue()
    if (fail && r.url().endsWith('room-people.glb')) return r.abort()
    if (delayed) return setTimeout(() => r.continue().catch(() => {}), 1800)
    return r.continue()
  })
  await page.goto('http://127.0.0.1:4198/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-scene-reason="asset-load"]', { timeout: 45000 })
  await page.waitForFunction(() => !document.getElementById('boot'))
  assert.equal(await page.$('canvas'), null)
  fail = false; delayed = true
  await page.click('[data-action="retry-3d"]')
  await page.waitForSelector('canvas')
  await page.evaluate(() => { const e = document.querySelector('.journey'); scrollTo(0, (e.offsetHeight - innerHeight) * .3) })
  await new Promise(r => setTimeout(r, 500))
  const hidden = await page.evaluate(() => getComputedStyle(document.querySelector('.journey-canvas')).visibility === 'hidden')
  rows.push({ check: 'retry never exposes absent interior', passed: hidden })
  fs.writeFileSync(`docs/evidence/loading-only/${process.argv[2] || 'recovery'}.json`, JSON.stringify(rows, null, 2))
  assert.ok(hidden, 'retry canvas must remain hidden until its interior is ready')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.journey-canvas')).visibility === 'visible', { timeout: 45000 })
  assert.equal(await page.$('[data-scene-reason]'), null)
  rows.push({ check: 'retry recovers and reveals complete scene', passed: true })
  const owned = await page.evaluate(() => {
    const resources = new Set()
    window.__scene().getObjectByName('accepted-clinic').traverse(n => {
      if (!n.isMesh) return
      resources.add(n.geometry)
      if (n.skeleton?.boneTexture) resources.add(n.skeleton.boneTexture)
      for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
        resources.add(m)
        for (const v of Object.values(m)) if (v?.isTexture) resources.add(v)
      }
    })
    window.__disposed = [...resources].map(r => { const row = { type: r.type || r.constructor.name, count: 0 }; r.addEventListener('dispose', () => row.count++); return row })
    return resources.size
  })
  // Context loss must remain a genuine recoverable error.
  await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await page.waitForSelector('[data-scene-reason="context-lost"]')
  assert.ok(await page.$('[data-action="retry-3d"]'))
  rows.push({ check: 'context loss exposes remaining retry', passed: true })
  await page.waitForFunction(() => window.__disposed.every(r => r.count > 0))
  const disposal = await page.evaluate(() => window.__disposed)
  assert.ok(disposal.every(r => r.count === 1), 'each unique owned geometry/material/texture is disposed exactly once')
  rows.push({ check: 'owned GPU resource disposal', passed: true, owned, disposal })
  delayed = false
  await page.click('[data-action="retry-3d"]')
  await page.waitForFunction(() => document.querySelector('.journey-canvas') && getComputedStyle(document.querySelector('.journey-canvas')).visibility === 'visible', { timeout: 45000 })
  await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await page.waitForSelector('[data-scene-reason="context-lost"]')
  assert.equal(await page.$('[data-action="retry-3d"]'), null)
  rows.push({ check: 'two-retry ceiling preserved', passed: true })
  // Inject the real timeout callback early; preserve production's45s value.
  await page.evaluateOnNewDocument(() => {
    const original = window.setTimeout.bind(window)
    window.setTimeout = (fn, ms, ...args) => original(fn, ms === 45000 ? 700 : ms, ...args)
  })
  delayed = true
  await page.goto('http://127.0.0.1:4198/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-scene-reason="asset-timeout"]', { timeout: 10000 })
  await new Promise(r => setTimeout(r, 2500))
  assert.ok(await page.$('[data-scene-reason="asset-timeout"]'))
  assert.equal(await page.$('canvas'), null)
  assert.ok(await page.$('[data-action="retry-3d"]'))
  rows.push({ check: 'injected timeout aborts pending loads; late callbacks cannot replace error or revive canvas', passed: true })
  fs.writeFileSync(`docs/evidence/loading-only/${process.argv[2] || 'recovery'}.json`, JSON.stringify(rows, null, 2))
  console.log(JSON.stringify(rows))
} finally { await browser.close() }
