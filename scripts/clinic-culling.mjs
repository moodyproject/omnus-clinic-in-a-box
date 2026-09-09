import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const out = 'docs/evidence/performance-choreography'
const phase = process.argv[2] || 'after'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const reports = []
try {
  for (const width of (phase === 'red' ? [390] : [390, 1440])) {
    const page = await browser.newPage()
    await page.setViewport({ width, height: width === 390 ? 844 : 900, deviceScaleFactor: 1, isMobile: width === 390 })
    await page.goto('http://127.0.0.1:4198/', { waitUntil: 'networkidle0' })
    await page.waitForFunction(() => window.__omnus?.scene.getObjectByName('room-people'))
    const result = await page.evaluate(async ({ quick }) => {
      const s = window.__omnus, j = await import('/src/scroll/journey.ts')
      const root = s.scene.getObjectByName('accepted-clinic'), meshes = []
      root.traverse(n => { if (n.isSkinnedMesh) meshes.push(n) })
      s.setFrameloop('never')
      let time = s.clock.elapsedTime
      const advance = p => { j.journeyState.p = p; j.journeyState.snap = true; s.advance(time += 1 / 60) }
      const update = root.updateMatrixWorld
      const flags = meshes.map(n => n.frustumCulled)
      const mode = enabled => {
        root.updateMatrixWorld = enabled ? update : Object.getPrototypeOf(root).updateMatrixWorld
        meshes.forEach((n, i) => { n.frustumCulled = enabled ? flags[i] : false })
      }
      const stats = values => { const sorted = [...values].sort((a, b) => a - b); return { median: sorted[Math.floor(sorted.length / 2)], p95: sorted[Math.floor(sorted.length * .95)] } }
      const measure = p => {
        for (let i = 0; i < 45; i++) advance(p)
        const times = []
        for (let i = 0; i < 90; i++) { const t = performance.now(); advance(p); s.gl.getContext().finish(); times.push(performance.now() - t) }
        return { ...stats(times), calls: s.gl.info.render.calls, triangles: s.gl.info.render.triangles }
      }
      const pairs = []
      for (const p of (quick ? [.32] : [.32, .47, .6, .7, .81])) {
        for (let run = 0; run < (quick ? 1 : 3); run++) {
          const pair = { p, run }
          for (const enabled of (run % 2 ? [true, false] : [false, true])) { mode(enabled); pair[enabled ? 'culled' : 'unculled'] = measure(p) }
          pairs.push(pair)
        }
      }
      mode(true)
      if (quick) return { meshes: meshes.length, pairs }
      const movingSweeps = []
      for (let run = 0; run < 3; run++) {
        const pair = { run }
        for (const enabled of (run % 2 ? [true, false] : [false, true])) {
          mode(enabled)
          for (let i = 0; i <= 120; i++) advance(.18 + .65 * i / 120)
          const times = []; let triangles = 0, calls = 0
          for (let i = 0; i <= 120; i++) {
            const start = performance.now(); advance(.18 + .65 * i / 120); s.gl.getContext().finish(); times.push(performance.now() - start)
            triangles += s.gl.info.render.triangles; calls += s.gl.info.render.calls
          }
          pair[enabled ? 'culled' : 'unculled'] = { ...stats(times), totalMs: times.reduce((a,b) => a+b,0), triangles, calls }
        }
        movingSweeps.push(pair)
      }
      const gl = s.gl.getContext(), size = s.gl.getDrawingBufferSize(meshes[0].position.clone())
      const pixels = () => {
        s.gl.render(s.scene, s.camera)
        const data = new Uint8Array(size.x * size.y * 4)
        gl.readPixels(0, 0, size.x, size.y, gl.RGBA, gl.UNSIGNED_BYTE, data)
        return data
      }
      const poses = [0, .19, .225, .28, .32, .34, .375, .395, .4075, .415, .425, .43, .47, .495, .525, .60, .615, .63, .65, .70, .745, .78, .82, .9, 1]
      const containment = [], equivalence = []
      let staleMisses = 0, checked = 0
      // Deliberately retain the FIRST-pose sphere as the stale-bounds negative control.
      advance(0)
      const stale = meshes.map(n => { n.computeBoundingSphere(); return n.boundingSphere.clone() })
      for (const p of [...poses, ...poses.slice().reverse()]) {
        mode(true); advance(p)
        let misses = 0, maxExcess = 0
        meshes.forEach((n, k) => {
          n.skeleton.update()
          const v = n.position.clone(), sphere = n.boundingSphere
          for (let i = 0; i < n.geometry.attributes.position.count; i++) {
            n.getVertexPosition(i, v); checked++
            const excess = v.distanceTo(sphere.center) - sphere.radius
            if (excess > 1e-6) { misses++; maxExcess = Math.max(maxExcess, excess) }
            if (v.distanceTo(stale[k].center) > stale[k].radius + 1e-6) staleMisses++
          }
        })
        containment.push({ p, misses, maxExcess })
        // Same pose, same camera, same renderer; synchronous read avoids a cleared drawing buffer.
        mode(false); const reference = pixels()
        mode(true); const candidate = pixels()
        let changed = 0, maxDelta = 0, nonzero = 0
        for (let i = 0; i < reference.length; i++) {
          if (reference[i]) nonzero++
          const d = Math.abs(reference[i] - candidate[i]); if (d) { changed++; maxDelta = Math.max(maxDelta, d) }
        }
        equivalence.push({ p, changedChannels: changed, maxDelta, nonzero })
      }
      mode(true)
      return { meshes: meshes.length, pairs, movingSweeps, checked, staleMisses, containment, equivalence }
    }, { quick: phase === 'red' })
    reports.push({ width, ...result })
    fs.writeFileSync(`${out}/culling-${phase}.json`, JSON.stringify(reports, null, 2))
    assert.equal(result.meshes, 36)
    for (const pair of result.pairs.filter(x => x.p === .32 || x.p === .47)) {
      assert.ok(pair.culled.triangles < pair.unculled.triangles * .8, `active room must submit at least 20% fewer triangles: ${JSON.stringify(pair)}`)
    }
    if (phase !== 'red') {
      assert.ok(result.staleMisses > 0, 'stale bind-pose negative control must fail containment')
      assert.ok(result.containment.every(x => x.misses === 0), 'all actual deformed vertices must be inside fresh bounds')
      assert.ok(result.equivalence.every(x => x.changedChannels === 0 && x.nonzero > 1000), 'culled and unculled framebuffers must match exactly, not be blank')
    }
    console.log(JSON.stringify({ width, pairs: result.pairs, checked: result.checked, staleMisses: result.staleMisses, containmentPass: result.containment?.every(x => !x.misses), framebufferPass: result.equivalence?.every(x => !x.changedChannels) }))
    await page.close()
  }
} finally { await browser.close() }
