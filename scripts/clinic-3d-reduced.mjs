import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const out = `docs/evidence/3d-only/reduced-${process.env.PHASE || 'green'}`
fs.mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const rows = []
try {
 for (const width of [1440, 390]) {
  const page = await browser.newPage(); await page.setCacheEnabled(false)
  await page.setViewport({ width, height: 844, isMobile: width === 390, hasTouch: width === 390 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4206/', { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__omnus?.scene.getObjectByName('room-people'))
  const sample = async p => {
   await page.evaluate(p => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + p * (e.offsetHeight - innerHeight)) }, p)
   await new Promise(resolve => setTimeout(resolve, 1400))
   return page.evaluate(() => {
    const s = window.__omnus, bones = [], skeletons = new Set()
    s.scene.traverse(n => { if (n.isBone) bones.push([...n.position.toArray(), ...n.quaternion.toArray()]); if (n.isSkinnedMesh) skeletons.add(n.skeleton.bones[0]) })
    return { camera: [...s.camera.position.toArray(), ...s.camera.quaternion.toArray(), s.camera.fov], bones, skeletons: skeletons.size, render: s.gl.info.render }
   })
  }
  const a = await sample(.44), b = await sample(.48)
  assert.deepEqual(a.camera, b.camera, 'reduced motion uses a fixed 3D camera pose within a room')
  assert.deepEqual(a.bones, b.bones, 'reduced motion holds actual actor bones within a room')
  assert.equal(a.skeletons, 6)
  assert.ok(a.render.calls > 0 && a.render.triangles > 0)
  await page.screenshot({ path: `${out}/${width}-consult.png` })
  const c = await sample(.60)
  assert.notDeepEqual(c.camera, b.camera, 'next room still navigates to a real 3D pose')
  await page.screenshot({ path: `${out}/${width}-review.png` })
  assert.equal(await page.$('.static-journey, [data-action="enable-3d"], [data-action="view-static"]'), null)
  rows.push({ width, pass: true, skeletons: a.skeletons, render: a.render, camera: a.camera })
  await page.close()
 }
 console.log('PASS', JSON.stringify(rows))
} catch (error) { rows.push({ pass: false, error: String(error) }); console.error(error); process.exitCode = 1 }
finally { fs.writeFileSync(`${out}/results.json`, JSON.stringify(rows, null, 2)); await browser.close() }
