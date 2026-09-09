import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import sharp from 'sharp'
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE || '/Users/moud/.hermes/hermes-agent/package.json')
const { chromium, webkit } = require('playwright')

const base = process.env.BASE_URL || 'http://127.0.0.1:4196/'
const out = process.env.MOTION_OUT || 'docs/evidence/mobile-recovery/motion'
fs.mkdirSync(out, { recursive: true })
const rows = []
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
 if (process.env.ENGINES && !process.env.ENGINES.split(',').includes(engine)) continue
 const browser = await launcher.launch({ headless: true, ...(engine === 'chromium' ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } : {}) })
 try {
  for (const width of [375, 390, 1440]) {
   if (process.env.WIDTHS && !process.env.WIDTHS.split(',').map(Number).includes(width)) continue
   const height = width === 1440 ? 900 : 844
   const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 500, hasTouch: width < 500, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
   const page = await context.newPage(), errors = []
   page.on('pageerror', e => errors.push(String(e)))
   await page.goto(base, { waitUntil: 'networkidle' })
   await page.waitForFunction(() => window.__omnus?.scene.getObjectByName('room-people'))
   await page.evaluate(async () => { window.motionState = await import('/src/scroll/journey.ts') })
   const scroll = async p => {
    await page.evaluate(p => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * p) }, p)
    await page.waitForFunction(p => Math.abs(window.motionState.journeyState.p - p) < .0005 && Math.abs(window.motionState.smoothedState.p - window.motionState.journeyState.p) < 1e-10, p)
    await page.waitForTimeout(150)
    return page.evaluate(() => {
     const s = window.__omnus, root = s.scene.getObjectByName('accepted-clinic')
     root.updateMatrixWorld(true)
     const actors = ['physician-seated', 'patient-seated', 'Reception_Staff', 'Reception_Visitor', 'Review_Physician', 'Follow_Coordinator'].map(id => {
      const node = root.getObjectByName(id), bones = [], points = []
      node.traverse(n => { if (n.isBone) bones.push(...n.position.toArray(), ...n.quaternion.toArray()) })
      // Travel is authored on the animated rig, not the unchanged GLB wrapper.
      node.traverse(n => { if (!n.isMesh) return; if (n.isSkinnedMesh) n.skeleton.update(); for (let i = 0; i < n.geometry.attributes.position.count; i += 37) { const v = n.position.clone(); n.getVertexPosition(i, v); points.push(v.applyMatrix4(n.matrixWorld).toArray()) } })
      const center = [0, 1, 2].map(k => points.reduce((sum, p) => sum + p[k], 0) / points.length)
      return { id, center, bones }
     })
     const textures = new Set(); root.traverse(n => { if (n.isMesh) for (const m of Array.isArray(n.material) ? n.material : [n.material]) for (const v of Object.values(m)) if (v?.isTexture) textures.add(v) })
     const texturePixels = [...textures].reduce((sum, t) => sum + (t.image?.width || 0) * (t.image?.height || 0), 0)
     return { p: window.motionState.smoothedState.p, actors, render: { calls: s.gl.info.render.calls, triangles: s.gl.info.render.triangles, memory: s.gl.info.memory, clinicTexturePixels: texturePixels }, overflow: document.documentElement.scrollWidth > innerWidth }
    })
   }
   const arrival = await scroll(.28), consult = await scroll(.47), gesture = await scroll(.495)
   const deltas = consult.actors.map((a, i) => ({ id: a.id, boneDelta: Math.max(...a.bones.map((v, j) => Math.abs(v - gesture.actors[i].bones[j]))) }))
   assert.ok(deltas.every(r => r.boneDelta > .0005), 'all six real bone transforms articulate')
   const patientTravel = Math.hypot(...arrival.actors[1].center.map((v, i) => v - consult.actors[1].center[i]))
   assert.ok(patientTravel > .15, 'actual skinned patient geometry travels to consultation')
   await page.screenshot({ path: `${out}/${engine}-${width}-consult.png` })
   const overhead = []
   for (const p of width < 500 ? [.82, .87, .85, .82] : [.82]) {
    await scroll(p)
    const bytes = await page.screenshot({ path: `${out}/${engine}-${width}-overhead-${p}.png` })
    const { data, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    let pixels = 0
    for (let y = 125; y < height * .64; y++) for (let x = 10; x < width - 10; x++) { const k = (y * info.width + x) * info.channels; const c = [data[k], data[k + 1], data[k + 2]]; if (Math.max(...c) - Math.min(...c) > 22) pixels++ }
    assert.ok(pixels > 1000, 'clinic overhead remains visible, not gray panel')
    overhead.push({ p, pixels })
   }
   const reverse = await scroll(.47)
   const reverseError = Math.max(...consult.actors.flatMap((a, i) => a.bones.map((v, j) => Math.abs(v - reverse.actors[i].bones[j]))))
   assert.ok(reverseError < .0001, `native reverse restores actual transforms: ${reverseError}`)
   assert.equal(reverse.overflow, false); assert.deepEqual(errors, [])
   const row = { engine, version: browser.version(), width, deltas, patientTravel, reverseError, overhead, render: consult.render, errors, pass: true }
   rows.push(row); fs.writeFileSync(`${out}/results.json`, JSON.stringify(rows, null, 2)); console.log(JSON.stringify(row))
   await context.close()
  }
 } finally { await browser.close() }
}
const expected = (process.env.ENGINES ? process.env.ENGINES.split(',').length : 2) * (process.env.WIDTHS ? process.env.WIDTHS.split(',').length : 3)
assert.equal(rows.length, expected)
