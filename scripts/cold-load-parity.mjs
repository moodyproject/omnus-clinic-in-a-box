// Visual parity: baseline (deployed loading-only dist) vs candidate at fixed
// poses, desktop 1440 and phone 390. Compares full scene state (camera,
// projection, every mesh/bone world matrix + vertex count, plus a hash of
// every position attribute) and screenshot pixels.
// usage: node scripts/cold-load-parity.mjs   (baseline :4311, candidate :4312)
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'

const out = process.env.PARITY_OUT || 'docs/evidence/cold-load/parity'
fs.mkdirSync(out, { recursive: true })
const SERVERS = { baseline: process.env.BASELINE || 'http://127.0.0.1:4311/', candidate: process.env.CANDIDATE || 'http://127.0.0.1:4312/' }
const POSES = [0, 0.18, 0.3, 0.45, 0.59, 0.72, 0.82, 0.96]
const wait = ms => new Promise(r => setTimeout(r, ms))
const hash = v => crypto.createHash('sha256').update(v).digest('hex')

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
}

async function capture(browser, label, width, pose) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: width === 390 ? 844 : 900, deviceScaleFactor: width === 390 ? 3 : 1 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await page.evaluateOnNewDocument(instrument)
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  await page.goto(`${SERVERS[label]}?pose=${pose}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => window.__find()?.scene.getObjectByName('room-people') && !document.getElementById('boot'), { timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  await wait(2600)
  const state = await page.evaluate(() => {
    const s = window.__find(), objects = []
    s.scene.updateMatrixWorld(true)
    const digest = a => { let h = 2166136261; const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 16777619) } return h >>> 0 }
    s.scene.traverse(n => {
      if (!(n.isMesh || n.isBone)) return
      const attrs = n.geometry ? Object.fromEntries(Object.entries(n.geometry.attributes).map(([k, a]) => [k, digest(a.array)])) : undefined
      objects.push({ name: n.name, type: n.type, visible: n.visible, matrix: n.matrixWorld.toArray().map(x => Math.round(x * 1e7) / 1e7), vertices: n.geometry?.attributes.position?.count, attrs })
    })
    return { camera: s.camera.matrixWorld.toArray(), projection: s.camera.projectionMatrix.toArray(), objects }
  })
  const png = await page.screenshot({ path: `${out}/${width}-${pose}-${label}.png` })
  await page.close()
  return { state, png, errors }
}

async function pixelDiff(a, b, file) {
  const [x, y] = await Promise.all([a, b].map(p => sharp(p).raw().ensureAlpha().toBuffer({ resolveWithObject: true })))
  assert.equal(x.info.width, y.info.width)
  let differing = 0, max = 0
  const diff = Buffer.alloc(x.data.length)
  for (let i = 0; i < x.data.length; i += 4) {
    const d = Math.max(Math.abs(x.data[i] - y.data[i]), Math.abs(x.data[i + 1] - y.data[i + 1]), Math.abs(x.data[i + 2] - y.data[i + 2]))
    if (d) { differing++; max = Math.max(max, d); diff[i] = 255; diff[i + 3] = 255 } else { diff[i + 3] = 255 }
  }
  if (differing) await sharp(diff, { raw: x.info }).png().toFile(file)
  return { differing, max, totalPixels: x.data.length / 4 }
}

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, pipe: true, timeout: 60000 })
const rows = []
try {
  for (const width of (process.env.WIDTHS || '1440,390').split(',').map(Number)) for (const pose of POSES) {
    const base = await capture(browser, 'baseline', width, pose)
    const cand = await capture(browser, 'candidate', width, pose)
    const px = await pixelDiff(base.png, cand.png, `${out}/${width}-${pose}-diff.png`)
    const row = {
      width, pose,
      sceneEqual: hash(JSON.stringify(base.state)) === hash(JSON.stringify(cand.state)),
      objects: cand.state.objects.length,
      screenshotBytesEqual: hash(base.png) === hash(cand.png),
      ...px,
      errors: [...base.errors, ...cand.errors],
    }
    rows.push(row)
    fs.writeFileSync(`${out}/parity.json`, JSON.stringify(rows, null, 2))
    console.log(JSON.stringify(row))
  }
} finally { await browser.close() }
assert.ok(rows.every(r => r.sceneEqual), 'scene state must be identical at every pose')
assert.ok(rows.every(r => !r.errors.length), 'no page errors')
