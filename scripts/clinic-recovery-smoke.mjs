import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const base = process.env.BASE_URL || 'http://127.0.0.1:4199/omnus-clinic-in-a-box/'
const rows = []
const proveClinic = async page => {
 await page.waitForFunction(() => {
  for (const root of window.__qaRoots) {
   const stack = [root.current], seen = new Set()
   while (stack.length) {
    const f = stack.pop(); if (!f || seen.has(f)) continue; seen.add(f)
    const store = f.memoizedProps?.value
    if (store?.getState) {
     const s = store.getState()
     if (s.scene?.getObjectByName('room-people')) { window.__qaScene = s; return true }
    }
    stack.push(f.child, f.sibling)
   }
  }
  return false
 })
 await page.evaluate(() => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * .47) })
 await new Promise(r => setTimeout(r, 3000))
 return page.evaluate(() => {
  const s = window.__qaScene, root = s.scene.getObjectByName('accepted-clinic'), gl = s.gl.getContext()
  const capture = () => { s.gl.render(s.scene, s.camera); const data = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4); gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, data); return data }
  const shown = capture(), triangles = s.gl.info.render.triangles
  root.visible = false; const hidden = capture(); root.visible = true; capture()
  let changedChannels = 0, meshes = 0
  for (let i = 0; i < shown.length; i++) if (shown[i] !== hidden[i]) changedChannels++
  root.traverse(n => { if (n.isSkinnedMesh) meshes++ })
  return { meshes, triangles, changedChannels }
 })
}
try {
 for (const width of [1440, 390]) {
  const page = await browser.newPage(); let fail = true, assets = 0
  await page.evaluateOnNewDocument(() => {
   window.__qaRoots = new Set()
   window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: (_id, root) => window.__qaRoots.add(root), onCommitFiberUnmount: () => {}, onPostCommitFiberRoot: () => {} }
  })
  await page.setViewport({ width, height: width === 1440 ? 900 : 844, isMobile: width < 500, hasTouch: width < 500 })
  await page.setRequestInterception(true)
  page.on('request', r => { if (r.url().endsWith('.glb')) assets++; if (fail && r.url().endsWith('/patient-seated.glb')) r.abort(); else r.continue() })
  await page.goto(base, { waitUntil: 'networkidle0' })
  await page.waitForSelector('[data-scene-reason="asset-load"]')
  fail = false; await page.click('[data-action="retry-3d"]')
  await page.waitForSelector('canvas'); await page.waitForNetworkIdle(); await new Promise(r => setTimeout(r, 500))
  assert.equal(await page.$('.scene-error'), null)
  await page.evaluate(() => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * .47) })
  await new Promise(r => setTimeout(r, 3000))
  await page.screenshot({ path: `docs/evidence/performance-choreography/production-retry-${width}.png` })
  const assetProof = await proveClinic(page)
  assert.equal(assetProof.meshes, 36); assert.ok(assetProof.triangles > 100000 && assetProof.changedChannels > 1000, 'asset Retry must attach AND visibly render clinic')
  assert.ok(assets >= 9, 'failed partial load plus full five-asset retry')
  await page.$eval('canvas', canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())
  await page.waitForSelector('[data-scene-reason="context-lost"]')
  await page.click('[data-action="retry-3d"]'); await page.waitForSelector('canvas'); await page.waitForNetworkIdle()
  assert.equal(await page.$('.scene-error'), null)
  const contextProof = await proveClinic(page)
  assert.equal(contextProof.meshes, 36); assert.ok(contextProof.triangles > 100000 && contextProof.changedChannels > 1000, 'context Retry must attach AND visibly render clinic')
  rows.push({ width, assetFailureRetry: true, contextLossRetry: true, assets, assetProof, contextProof })
  await page.close()
 }
 console.log(rows)
 fs.writeFileSync('docs/evidence/performance-choreography/production-retry.json', JSON.stringify(rows, null, 2))
} finally { await browser.close() }
