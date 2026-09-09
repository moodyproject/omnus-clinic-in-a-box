import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base = process.env.BASE_URL || 'http://127.0.0.1:4198/'
const phase = process.argv[2] || 'after'
const out = `docs/evidence/performance-choreography/${phase}-roles`
fs.mkdirSync(out, { recursive: true })
const roles = [
 ['Reception_Staff', .30, .28, .37], ['Reception_Visitor', .32, .305, .38],
 ['physician-seated', .47, .435, .525], ['Review_Physician', .60, .565, .635],
 ['Follow_Coordinator', .71, .67, .745], ['patient-seated', .47, .387, .43],
]
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const rows = []
try {
 for (const width of [1440, 390]) {
  const page = await browser.newPage(), height = width === 1440 ? 900 : 844
  await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 500, hasTouch: width < 500 })
  await page.goto(base, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__omnus?.scene.getObjectByName('room-people'))
  for (const [id, stage, a, b] of roles) {
   await page.evaluate(async stage => {
    window.journey = await import('/src/scroll/journey.ts')
    window.__omnus.setFrameloop('demand')
    window.__omnusScrollTo(stage)
   }, stage)
   await page.waitForFunction(() => window.__omnus.get().internal.frames === 0)
   await page.evaluate(async () => {
    const s = window.__omnus; s.setFrameloop('never')
    const { createAcceptedMotion } = await import('/src/three/clinic/acceptedMotion.ts')
    window.roleMotion = createAcceptedMotion(s.scene.getObjectByName('accepted-clinic'))
   })
   const samples = []
   for (const t of [0, .2, .4, .6, .8, 1]) {
    const p = a + (b - a) * t
    const sample = await page.evaluate(({ id, p }) => {
     const s = window.__omnus, actor = s.scene.getObjectByName(id)
     window.roleMotion.update(p); s.scene.updateMatrixWorld(true); s.gl.render(s.scene, s.camera)
     const points = [], bones = {}, overlays = {}
     const container = id === 'physician-seated' || id === 'patient-seated' ? actor : s.scene.getObjectByName('room-people')
     actor.traverse(n => {
      if (n.isBone) {
       const name = n.userData.name ?? n.name; bones[name] = [...n.position.toArray(), ...n.quaternion.toArray()]
       const track = container.animations.flatMap(c => c.tracks.map(track => ({ track, duration: c.duration }))).find(({ track }) => track.name === `${n.name}.quaternion`)
       if (track) { const original = n.quaternion.clone().fromArray(track.track.createInterpolant().evaluate(p * track.duration)); const delta = original.invert().multiply(n.quaternion); overlays[name] = delta.toArray() }
      }
      if (!n.isSkinnedMesh) return
      n.skeleton.update()
      for (let i = 0; i < n.geometry.attributes.position.count; i += 37) { const v = n.position.clone(); n.getVertexPosition(i, v); v.applyMatrix4(n.matrixWorld).project(s.camera); points.push([(v.x + 1) * innerWidth / 2, (1 - v.y) * innerHeight / 2, v.z]) }
     })
     return { p, bones, overlays, points }
    }, { id, p })
    const file = `${width}-${id}-${t}.png`
    await page.screenshot({ path: `${out}/${file}` })
    samples.push({ ...sample, file })
   }
   const maxDisplacement = Math.max(...samples.slice(1).flatMap(s => s.points.map((point, i) => Math.hypot(point[0] - samples[0].points[i][0], point[1] - samples[0].points[i][1]))))
   const overlayAngle = name => Math.max(...samples.map(s => 2 * Math.acos(Math.min(1, Math.abs(s.overlays[name]?.[3] ?? 1)))))
   const allPoints = samples.flatMap(s => s.points)
   const bounds = { left: Math.min(...allPoints.map(p => p[0])), right: Math.max(...allPoints.map(p => p[0])), top: Math.min(...allPoints.map(p => p[1])), bottom: Math.max(...allPoints.map(p => p[1])) }
   const determinism = await page.evaluate(({ p, bones, id }) => {
    const actor = window.__omnus.scene.getObjectByName(id)
    let error = 0
    for (const seek of [1, 0, p, p, .8, p]) { window.roleMotion.update(seek); if (seek !== p) continue; actor.traverse(n => { if (n.isBone) [...n.position.toArray(), ...n.quaternion.toArray()].forEach((v, i) => { error = Math.max(error, Math.abs(v - bones[n.userData.name ?? n.name][i])) }) }) }
    window.roleMotion.dispose(); return error
   }, { p: samples[2].p, bones: samples[2].bones, id })
   const row = { width, height, id, stage, maxDisplacement, bounds, leftElbowOverlay: overlayAngle('lowerarm01.L'), rightElbowOverlay: overlayAngle('lowerarm01.R'), determinism, samples: samples.map(({ points, ...s }) => s) }
   rows.push(row); console.log(JSON.stringify({ ...row, samples: undefined }))
   fs.writeFileSync(`${out}/results.json`, JSON.stringify(rows, null, 2))
  }
  await page.close()
 }
 fs.writeFileSync(`${out}/contact-sheet.html`, `<!doctype html><title>Fixed camera real actor poses: ${phase}</title><style>body{font:14px system-ui;background:#eee}section{margin:24px 0}.strip{display:flex;gap:8px}figure{margin:0}img{display:block;max-width:240px}figcaption{padding:5px}</style><h1>${phase}: fixed camera, six samples per actor</h1><p>Raw page screenshots, no manual visual acceptance claimed. Camera held at each role's narrative stage; only the real actor mixer is scrubbed.</p>${rows.map(r => `<section><h2>${r.width}px: ${r.id}, camera ${r.stage}</h2><div class="strip">${r.samples.map(s => `<figure><img src="${s.file}"><figcaption>progress ${s.p.toFixed(4)}</figcaption></figure>`).join('')}</div></section>`).join('')}`)
 assert.equal(rows.length, 12)
 for (const row of rows) { assert.ok(row.maxDisplacement >= 12, `${row.id} at ${row.width}px needs >=12px real surface excursion`); assert.ok(row.determinism < 1e-8, 'reverse/repeat exact') }
 for (const row of rows.filter(r => r.id === 'Review_Physician')) assert.ok(row.leftElbowOverlay > .15 && row.rightElbowOverlay > .15, 'reviewer must work with BOTH hands, not the generic single-arm wave')
} finally { await browser.close() }
