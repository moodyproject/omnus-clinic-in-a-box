/**
 * dev probe: evaluate an expression against the live r3f scene.
 * usage: node scripts/probe.mjs <url> <js-expression>
 * the expression sees `scene` (THREE.Scene) and `THREE`-less helpers.
 */
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const [url, expr] = process.argv.slice(2)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1500))
  const result = await page.evaluate((code) => {
    const state = window.__omnus
    if (!state) return 'no __omnus (dev only)'
    const scene = state.scene
    const fn = new Function('scene', 'state', code)
    return JSON.stringify(fn(scene, state), null, 1)
  }, expr)
  console.log(result)
} finally {
  await browser.close()
}
