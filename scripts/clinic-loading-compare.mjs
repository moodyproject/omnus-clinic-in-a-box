import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const out = 'docs/evidence/loading-only'
const mode = process.argv[2] || 'metrics'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, pipe: true, timeout: 60000 })
const results = []
const wait = ms => new Promise(r => setTimeout(r, ms))
function instrument() {
  window.__roots = new Set()
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, renderers: new Map(), inject(r) { this.renderers.set(1, r); return 1 }, onCommitFiberRoot(_id, root) { window.__roots.add(root) }, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {} }
  window.__find = () => {
    for (const root of window.__roots) {
      const stack = [root.current], seen = new Set()
      while (stack.length) {
        const f = stack.pop()
        if (!f || seen.has(f)) continue
        seen.add(f)
        const s = f.memoizedProps?.value?.getState?.()
        if (s?.scene && s?.gl) return s
        stack.push(f.child, f.sibling)
      }
    }
  }
  window.__renders = []; window.__samples = []
  const sample = () => {
    const s = window.__find()
    if (s && !s.gl.__observed) {
      s.gl.__observed = true
      const render = s.gl.render.bind(s.gl)
      s.gl.render = (...args) => {
        const t = performance.now(), root = s.scene.getObjectByName('accepted-clinic')
        const value = render(...args)
        window.__renders.push({ t, duration: performance.now() - t, model: !!root, visible: !!root?.parent?.visible, calls: s.gl.info.render.calls })
        return value
      }
    }
    const boot = document.getElementById('boot')
    window.__samples.push({ t: performance.now(), ready: !boot || boot.classList.contains('boot-done'), model: !!s?.scene.getObjectByName('room-people') })
    requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
}
async function openPage(width, reducedMotion) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: width === 390 ? 844 : 900, deviceScaleFactor: width === 390 ? 3 : 1 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reducedMotion }])
  await page.evaluateOnNewDocument(instrument)
  return page
}
async function ready(page) {
  await page.waitForFunction(() => window.__find()?.scene.getObjectByName('room-people') && !document.getElementById('boot'), { timeout: 45000 })
}
try {
  if (mode === 'metrics') {
    for (const width of [390, 1440]) for (const trial of [0, 1, 2]) {
      // Alternate order so the baseline does not always pay first browser use.
      for (const label of trial % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
        const page = await openPage(width, 'no-preference')
        const errors = []; page.on('pageerror', e => errors.push(String(e)))
        const client = await page.createCDPSession()
        await client.send('Network.enable')
        await client.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 2500000, uploadThroughput: 2500000 })
        const base = `http://127.0.0.1:${label === 'baseline' ? 4197 : 4198}/`
        for (const cache of ['cold', 'warm']) {
          if (cache === 'cold') await client.send('Network.clearBrowserCache')
          await page.goto(base, { waitUntil: 'domcontentloaded' })
          await ready(page)
          // The real first scroll, not a test setter. Wait for the authored damping.
          await page.evaluate(() => { const el = document.querySelector('.journey'); scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * .3) })
          await wait(1500)
          const row = await page.evaluate(() => ({ samples: window.__samples, renders: window.__renders, resources: performance.getEntriesByType('resource').filter(r => r.name.endsWith('.glb')).map(r => ({ name: r.name.split('/').pop(), start: r.startTime, end: r.responseEnd, transferred: r.transferSize, size: r.decodedBodySize })) }))
          results.push({ label, width, trial, cache, errors: [...errors], ...row })
          fs.writeFileSync(`${out}/metrics.json`, JSON.stringify(results, null, 2))
          console.log(JSON.stringify({ label, width, trial, cache, modelMs: row.samples.find(s => s.model)?.t, readyMs: row.samples.find(s => s.ready)?.t, maxRevealMs: Math.max(...row.renders.filter(r => r.visible).map(r => r.duration)) }))
          assert.deepEqual(errors, [])
        }
        await page.close()
      }
    }
  } else if (mode === 'visuals') {
    fs.mkdirSync(`${out}/visuals`, { recursive: true })
    for (const width of [390, 1440]) for (const preference of ['reduce', 'no-preference']) {
      for (const label of ['baseline', 'candidate']) {
        const page = await openPage(width, preference)
        for (const pose of [0, .18, .30, .45, .59, .72, .82, .96]) {
          await page.goto(`http://127.0.0.1:${label === 'baseline' ? 4197 : 4198}/?pose=${pose}`, { waitUntil: 'domcontentloaded' })
          await ready(page); await page.evaluate(() => document.fonts.ready); await wait(2200)
          const state = await page.evaluate(() => {
            const s = window.__find(), objects = []
            s.scene.updateMatrixWorld(true)
            s.scene.traverse(n => { if (n.isMesh || n.isBone) objects.push({ name: n.name, type: n.type, visible: n.visible, matrix: n.matrixWorld.toArray().map(x => Math.round(x * 1e8) / 1e8), vertices: n.geometry?.attributes.position?.count }) })
            return { camera: s.camera.matrixWorld.toArray(), projection: s.camera.projectionMatrix.toArray(), objects }
          })
          const name = `${width}-${preference}-${pose}-${label}`
          await page.screenshot({ path: `${out}/visuals/${name}.png` })
          results.push({ width, preference, pose, label, state })
          fs.writeFileSync(`${out}/visual-states.json`, JSON.stringify(results, null, 2))
          console.log(name)
        }
        await page.close()
      }
    }
  }
} finally { await browser.close() }
