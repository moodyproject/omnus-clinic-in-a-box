/**
 * capture the journey states for visual review.
 * drives the locally installed chrome via puppeteer-core (no browser download).
 *
 * usage: node scripts/capture.mjs [base-url] [output-dir]
 */
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const base = process.argv[2] ?? 'http://localhost:4174'
const out = process.argv[3] ?? 'screenshots'

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 }
const MOBILE = { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const MOBILE_390 = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

const shots = [
  ['01-hero', DESKTOP, '/'],
  ['02-opening', DESKTOP, '/?pose=0.165'],
  ['03-entering', DESKTOP, '/?pose=0.225'],
  ['04-reception', DESKTOP, '/?pose=0.32'],
  ['05-exam', DESKTOP, '/?pose=0.45'],
  ['06-review', DESKTOP, '/?pose=0.575'],
  ['07-follow-through', DESKTOP, '/?pose=0.69'],
  ['08-ops-overhead', DESKTOP, '/?pose=0.8'],
  ['09-closing', DESKTOP, '/?pose=0.9'],
  ['10-final', DESKTOP, '/?pose=1'],
  ['11-mobile-hero', MOBILE, '/'],
  ['12-mobile-exam', MOBILE, '/?pose=0.45'],
  ['13-mobile-overhead', MOBILE, '/?pose=0.85'],
  ['14-static-fallback', DESKTOP, '/?static=1'],
  ['15-mobile-opening', MOBILE, '/?pose=0.165'],
  ['16-mobile-final', MOBILE, '/?pose=1'],
  ['17-mobile390-hero', MOBILE_390, '/'],
  ['18-mobile390-exam', MOBILE_390, '/?pose=0.45'],
]

fs.mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
})

try {
  const page = await browser.newPage()
  for (const [name, viewport, route] of shots) {
    await page.setViewport(viewport)
    await page.goto(base + route, { waitUntil: 'networkidle0' })
    // let fonts land and the scene settle a few frames
    await page.evaluate(() => document.fonts.ready)
    await new Promise((r) => setTimeout(r, 1200))
    await page.screenshot({ path: path.join(out, `${name}.png`) })
    console.log(`captured ${name}`)
  }
} finally {
  await browser.close()
}
