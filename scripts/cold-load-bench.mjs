// Cold/warm load benchmark for the clinic journey.
// usage: BASE=https://node.omnuslabs.com/ LABEL=live RUNS=5 node scripts/cold-load-bench.mjs
// Profiles: desktop 1440x900 dpr1 unthrottled; phone 390x844 dpr3 with
// network 9 Mbps down / 1.5 Mbps up / 150 ms RTT and 4x CPU slowdown.
// Metrics per run: TTFB, DCL, first canvas frame (first gl.render call),
// first frame with the interior attached, ready (boot overlay dismissed),
// every response (bytes, cache status, encoding), false-ready frames, page
// errors and a scroll-gate probe (real wheel + key input during loading).
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE || 'http://127.0.0.1:4310/'
const label = process.env.LABEL || 'run'
const runs = Number(process.env.RUNS || 5)
const only = process.env.PROFILE
const out = process.env.OUT || 'docs/evidence/cold-load'
fs.mkdirSync(out, { recursive: true })

const PROFILES = {
  desktop: { width: 1440, height: 900, dpr: 1, net: null, cpu: 1 },
  phone: { width: 390, height: 844, dpr: 3, mobile: true, net: { download: 9e6 / 8, upload: 1.5e6 / 8, latency: 150 }, cpu: 4 },
}
// LINK=origin emulates the measured live cold-edge bottleneck for LOCAL
// servers: ~590 KB/s aggregate origin->Cloudflare throughput (curl, 5
// parallel GLBs, 13.15 MB in 22.3 s). Phone keeps its 150 ms RTT and CPU.
if (process.env.LINK === 'origin') {
  PROFILES.desktop.net = { download: 590e3, upload: 590e3, latency: 40 }
  PROFILES.phone.net = { download: 590e3, upload: 1.5e6 / 8, latency: 150 }
}

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
  window.__m = { firstRender: null, firstModelRender: null, bootSeen: false, samples: [] }
  const sample = () => {
    const s = window.__find()
    if (s && !s.gl.__observed) {
      s.gl.__observed = true
      const render = s.gl.render.bind(s.gl)
      s.gl.render = (...args) => {
        const t = performance.now()
        if (window.__m.firstRender === null) window.__m.firstRender = t
        if (window.__m.firstModelRender === null && s.scene.getObjectByName('room-people')) window.__m.firstModelRender = t
        return render(...args)
      }
    }
    const boot = document.getElementById('boot')
    if (boot) window.__m.bootSeen = true
    const canvas = document.querySelector('.journey-canvas')
    window.__m.samples.push({
      t: performance.now(),
      ready: window.__m.bootSeen && (!boot || boot.classList.contains('boot-done')),
      model: !!s?.scene.getObjectByName('room-people'),
      canvasVisible: !!canvas && getComputedStyle(canvas).visibility === 'visible',
      scrollY: window.scrollY,
    })
    requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
}

async function measure(browser, profileName, mode) {
  const p = PROFILES[profileName]
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  const cdp = await page.createCDPSession()
  await cdp.send('Network.enable')
  await page.setViewport({ width: p.width, height: p.height, deviceScaleFactor: p.dpr, isMobile: !!p.mobile, hasTouch: !!p.mobile })
  const responses = new Map()
  cdp.on('Network.responseReceived', e => {
    const h = Object.fromEntries(Object.entries(e.response.headers).map(([k, v]) => [k.toLowerCase(), v]))
    responses.set(e.requestId, { url: e.response.url, status: e.response.status, fromDisk: e.response.fromDiskCache, fromMemory: e.response.fromMemoryCache, cf: h['cf-cache-status'], enc: h['content-encoding'], cacheControl: h['cache-control'], type: h['content-type'] })
  })
  cdp.on('Network.loadingFinished', e => { const r = responses.get(e.requestId); if (r) r.encodedBytes = e.encodedDataLength })
  const errors = [], failed = [], http = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('requestfailed', r => failed.push({ url: r.url(), error: r.failure()?.errorText }))
  page.on('response', r => { if (r.status() >= 400) http.push({ url: r.url(), status: r.status() }) })
  await page.evaluateOnNewDocument(instrument)
  const throttle = async () => {
    if (p.net) await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: p.net.download, uploadThroughput: p.net.upload, latency: p.net.latency })
    if (p.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: p.cpu })
  }
  let result
  const go = async () => {
    await throttle()
    const t0 = Date.now()
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 })
    // Scroll-gate probe: real user input while the loading overlay is up.
    let gate = null
    const loading = await page.evaluate(() => !!document.getElementById('boot') && !document.getElementById('boot').classList.contains('boot-done'))
    if (loading) {
      await page.mouse.move(p.width / 2, p.height / 2)
      await page.mouse.wheel({ deltaY: 1200 })
      await page.keyboard.press('PageDown')
      await page.keyboard.press('Space')
      await new Promise(r => setTimeout(r, 400))
      gate = await page.evaluate(() => ({ scrollY: window.scrollY, stillLoading: !document.getElementById('boot')?.classList.contains('boot-done') }))
    }
    await page.waitForFunction(() => window.__find()?.scene.getObjectByName('room-people') && !document.getElementById('boot'), { timeout: Number(process.env.READY_TIMEOUT || 180000), polling: 100 })
    const wall = Date.now() - t0
    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0]
      const s = window.__m.samples
      return {
        ttfb: nav.responseStart, dcl: nav.domContentLoadedEventEnd,
        firstFrame: window.__m.firstRender, firstInteriorFrame: window.__m.firstModelRender,
        ready: s.find(x => x.ready)?.t,
        falseReadyFrames: s.filter(x => x.ready && !x.model).length,
        canvasVisibleBeforeModel: s.filter(x => x.canvasVisible && !x.model).length,
        scrollMovedWhileLoading: s.filter(x => !x.ready && x.scrollY !== 0).length,
        overflow: document.documentElement.scrollWidth > innerWidth,
        models: performance.getEntriesByType('resource').filter(r => /\.(glb|zst)(\?|$)/.test(r.name)).map(r => ({ name: r.name.split('/').pop(), start: Math.round(r.startTime), end: Math.round(r.responseEnd), transfer: r.transferSize, decoded: r.decodedBodySize })),
      }
    })
    // Post-ready: input scrolls again.
    await page.mouse.wheel({ deltaY: 600 })
    await new Promise(r => setTimeout(r, 500))
    const afterReadyScrollY = await page.evaluate(() => window.scrollY)
    return { wall, gate, afterReadyScrollY, ...m }
  }
  try {
    if (mode === 'warm') {
      await page.setCacheEnabled(true)
      await go() // prime
      responses.clear()
      await page.goto('about:blank')
    } else {
      await page.setCacheEnabled(false)
    }
    result = await go()
    const all = [...responses.values()]
    // Exclude data: URLs (the zstd decoder instantiates embedded WASM via
    // fetch(data:...)); CDP reports their bytes even though no wire is used.
    result.totalEncodedBytes = all.filter(r => /^https?:/.test(r.url)).reduce((a, r) => a + (r.encodedBytes || 0), 0)
    result.responses = all.filter(r => /\.(glb|zst|js|css|woff2)(\?|$)|\/$/.test(r.url)).map(r => ({ ...r, url: r.url.replace(/^https?:\/\/[^/]+/, '') }))
    result.errors = errors; result.failed = failed.filter(f => !/ERR_ABORTED/.test(f.error) || /\.(glb|zst)/.test(f.url)); result.http = http
  } finally {
    await context.close()
  }
  return result
}

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, pipe: true, timeout: 60000, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] })
const file = `${out}/${label}.json`
const rows = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []
try {
  for (const profile of Object.keys(PROFILES)) {
    if (only && only !== profile) continue
    for (const mode of ['cold', 'warm']) {
      if (process.env.MODE && process.env.MODE !== mode) continue
      for (let i = Number(process.env.START || 0); i < runs; i++) {
        let r
        try { r = await measure(browser, profile, mode) } catch (e) {
          // A run that never becomes ready is data, not a crash: keep it.
          rows.push({ label, base, profile, mode, run: i, at: new Date().toISOString(), timedOut: true, error: String(e).slice(0, 200) })
          fs.writeFileSync(file, JSON.stringify(rows, null, 2))
          console.log(JSON.stringify({ label, profile, mode, run: i, timedOut: true }))
          continue
        }
        rows.push({ label, base, profile, mode, run: i, at: new Date().toISOString(), ...r })
        fs.writeFileSync(file, JSON.stringify(rows, null, 2))
        console.log(JSON.stringify({ label, profile, mode, run: i, ready: Math.round(r.ready), firstFrame: Math.round(r.firstFrame), interior: Math.round(r.firstInteriorFrame), wall: r.wall, bytes: r.totalEncodedBytes, falseReady: r.falseReadyFrames, gate: r.gate, afterReadyScrollY: r.afterReadyScrollY, errors: r.errors.length + r.failed.length + r.http.length }))
      }
    }
  }
} finally { await browser.close() }
