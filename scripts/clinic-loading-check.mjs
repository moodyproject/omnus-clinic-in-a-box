import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base = process.env.BASE_URL || 'http://127.0.0.1:4196/'
const label = process.argv[2] || 'candidate'
const out = 'docs/evidence/loading-only'
fs.mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, pipe: true, timeout: 60000 })
const rows = []
try {
 for (const [runLabel, runBase] of process.env.COMPARE ? [['baseline-matched', 'http://127.0.0.1:4197/'], ['candidate-matched', 'http://127.0.0.1:4198/']] : [[label, base]]) {
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 })
  await page.setCacheEnabled(false)
  await page.setRequestInterception(true)
  page.on('request', r => r.url().endsWith('.glb') ? setTimeout(() => r.continue().catch(() => {}), 900) : r.continue())
  await page.evaluateOnNewDocument(() => {
    window.__roots = new Set()
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, renderers: new Map(), inject(r) { this.renderers.set(1, r); return 1 }, onCommitFiberRoot(_id, root) { window.__roots.add(root) }, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {} }
    window.__findScene = () => {
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
    window.__samples = []
    window.__renders = []
    window.__compiles = 0
    const sample = () => {
      const s = window.__findScene()
      if (s && !s.gl.__observed) {
        s.gl.__observed = true
        const render = s.gl.render.bind(s.gl), compile = s.gl.compile.bind(s.gl)
        s.gl.compile = (...args) => { window.__compiles++; return compile(...args) }
        s.gl.render = (...args) => {
          const t = performance.now()
          const value = render(...args)
          window.__renders.push({ t, duration: performance.now() - t, model: !!s.scene.getObjectByName('room-people') })
          return value
        }
      }
      const boot = document.getElementById('boot')
      window.__samples.push({ t: performance.now(), ready: !boot || boot.classList.contains('boot-done'), model: !!s?.scene.getObjectByName('room-people'), scroll: scrollY })
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  await page.goto(runBase + '?p=0.3', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__findScene()?.scene.getObjectByName('room-people'), { timeout: 45000 })
  await page.waitForFunction(() => !document.getElementById('boot'), { timeout: 45000 })
  const result = await page.evaluate(() => ({ samples: window.__samples, renders: window.__renders, compiles: window.__compiles, resources: performance.getEntriesByType('resource').filter(r => r.name.endsWith('.glb')).map(r => ({ name: r.name.split('/').pop(), start: r.startTime, end: r.responseEnd })) }))
  rows.push({ label: runLabel, ...result })
  fs.writeFileSync(`${out}/${runLabel}-loading.json`, JSON.stringify(result, null, 2))
  const first = result.samples.find(s => s.model)
  const falseReady = result.samples.filter(s => s.ready && !s.model)
  console.log(JSON.stringify({ label: runLabel, interiorMs: first?.t, falseReadyFrames: falseReady.length, resources: result.resources }))
  await page.close()
  if (process.env.COMPARE) continue
  assert.equal(falseReady.length, 0, 'loading overlay must not dismiss before interior attachment')
  assert.equal(result.resources.length, 5, 'exactly one request per GLB')
  assert.ok(Math.max(...result.resources.map(r => r.start)) - Math.min(...result.resources.map(r => r.start)) < 300, 'GLBs start concurrently')
  if (process.env.PREPARE) assert.ok(result.compiles > 0, 'interior materials must be prepared before readiness')
 }
} finally { await browser.close() }
