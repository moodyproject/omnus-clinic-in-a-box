import fs from 'node:fs'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import sharp from 'sharp'
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE || '/Users/moud/.hermes/hermes-agent/package.json')
const { chromium, webkit } = require('playwright')
const base = process.env.BASE_URL || 'https://moodyproject.github.io/omnus-clinic-in-a-box/'
const out = process.env.OUT || 'docs/evidence/mobile-framing-motion/live-before'
fs.mkdirSync(out, { recursive: true })
const rows = []
for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
 if (process.env.ENGINES && !process.env.ENGINES.split(',').includes(engine)) continue
 const browser = await launcher.launch({ headless: true, ...(engine === 'chromium' ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } : {}) })
 try {
  for (const width of (process.env.WIDTHS || '375,390,430').split(',').map(Number)) {
   const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: width < 500, hasTouch: width < 500, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
   const errors = []; page.on('pageerror', e => errors.push(String(e)))
   await page.goto(base, { waitUntil: 'networkidle' }); await page.locator('canvas').waitFor(); await page.waitForTimeout(1200)
   const images = [], checks = []
   for (const [name, p] of [['reception', .30], ['consult-a', .46], ['consult-b', .50], ['review', .60], ['follow', .71], ['overview', .82]]) {
    await page.evaluate(p => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * p) }, p)
    await page.waitForTimeout(1800)
    const path = `${out}/${engine}-${width}-${name}.png`; await page.screenshot({ path })
    const label = Buffer.from(`<svg width="${width}" height="28"><rect width="100%" height="100%" fill="white"/><text x="8" y="20" font-size="14">${engine} ${width} ${name} p=${p}</text></svg>`)
    images.push({ input: await sharp(path).extend({ top: 28, bottom: 0, left: 0, right: 0, background: 'white' }).composite([{ input: label, top: 0, left: 0 }]).png().toBuffer(), left: (images.length % 3) * width, top: Math.floor(images.length / 3) * 872 })
   }
   if (process.env.VERIFY === '1') {
    await page.evaluate(async () => { window.progressModule = await import('/src/scroll/journey.ts') })
    for (const [name, p, height] of [['reverse-follow', .71, 844], ['reverse-review', .60, 844], ['reverse-consult', .47, 844], ['reverse-reception', .30, 844], ['overview-short', .82, 720], ['overview-tall', .82, 900], ['overview-restored', .82, 844]]) {
     await page.setViewportSize({ width, height })
     await page.waitForTimeout(500) // allow the native ScrollTrigger resize refresh
     await page.evaluate(p => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * p) }, p)
     await page.waitForFunction(p => Math.abs(window.progressModule.journeyState.p - p) < .001 && Math.abs(window.progressModule.smoothedState.p - window.progressModule.journeyState.p) < 1e-8, p)
     await page.waitForTimeout(600)
     const check = await page.evaluate(() => {
      const s = window.__omnus; s.camera.updateMatrixWorld(true)
      const corners = [-.68, .68].flatMap(x => [-.68, .68].map(z => { const v = s.camera.position.clone().set(x, .136, z).project(s.camera); return [(v.x + 1) * innerWidth / 2, (1 - v.y) * innerHeight / 2] }))
      return { corners, overflow: document.documentElement.scrollWidth > innerWidth, canvas: document.querySelector('canvas').getBoundingClientRect().toJSON() }
     })
     assert.equal(check.overflow, false)
     if (name.startsWith('overview') && width < 500) assert.ok(check.corners.every(([x]) => x >= 12 && x <= width - 12), `${engine}/${width}/${name} whole chassis fit`)
     await page.screenshot({ path: `${out}/${engine}-${width}-${name}.png` }); checks.push({ name, p, height, ...check })
    }
    await page.locator('.nav-cta').click(); await page.locator('[role="dialog"]').waitFor(); await page.keyboard.press('Escape'); await page.locator('[role="dialog"]').waitFor({state:'detached'})
   }
   await sharp({ create: { width: width * 3, height: 1744, channels: 3, background: 'white' } }).composite(images).png().toFile(`${out}/${engine}-${width}-sheet.png`)
   rows.push({ engine, width, errors, checks }); fs.writeFileSync(`${out}/results.json`, JSON.stringify(rows, null, 2)); console.log(engine, width, 'captured'); assert.deepEqual(errors, [])
   await page.close()
  }
 } finally { await browser.close() }
}
assert.equal(rows.length, (process.env.ENGINES || 'chromium,webkit').split(',').length * (process.env.WIDTHS || '375,390,430').split(',').length)
