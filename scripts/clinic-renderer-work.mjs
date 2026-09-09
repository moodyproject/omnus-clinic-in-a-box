import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
try {
 const page = await browser.newPage()
 await page.goto('http://127.0.0.1:4198/?pose=.47', { waitUntil: 'networkidle0' })
 await page.waitForFunction(() => window.__omnus?.scene.getObjectByName('room-people'))
 const result = await page.evaluate(() => {
  const s = window.__omnus; s.setFrameloop('never')
  let updates = 0, nodes = 0
  const matrices = []
  for (const name of ['clinic-shell', 'consultation']) s.scene.getObjectByName(name).traverse(n => {
   nodes++; const update = n.updateMatrix.bind(n)
   n.updateMatrix = () => { updates++; return update() }
   matrices.push([n, n.matrix.toArray()])
  })
  const start = performance.now()
  for (let i = 0; i < 60; i++) s.gl.render(s.scene, s.camera)
  const totalMs = performance.now() - start
  const matrixError = Math.max(...matrices.flatMap(([n, before]) => before.map((v, i) => Math.abs(v - n.matrix.elements[i]))))
  return { nodes, updates, totalMs, matrixError, preserveDrawingBuffer: s.gl.getContext().getContextAttributes().preserveDrawingBuffer }
 })
 fs.writeFileSync(`docs/evidence/performance-choreography/${process.argv[2] || 'after'}-renderer-work.json`, JSON.stringify(result, null, 2))
 console.log(result)
 assert.equal(result.updates, 0, 'immutable architecture/furniture must not recompose identical local matrices on every render')
 assert.equal(result.matrixError, 0)
 // Screenshots are compositor captures, not a reason to retain the WebGL buffer.
 assert.equal(result.preserveDrawingBuffer, false)
} finally { await browser.close() }
