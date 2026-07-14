/**
 * capture the journey states for visual review.
 * drives the locally installed chrome via puppeteer-core (no browser download).
 *
 * usage: node scripts/capture.mjs [base-url] [output-dir] [--quick]
 *   --quick captures the 1440x900 + 375x812 sets only
 */
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const quick = process.argv.includes('--quick')
const base = args[0] ?? 'http://localhost:4174'
const out = args[1] ?? 'screenshots'

const VIEWPORTS = {
  d1440: { width: 1440, height: 900, deviceScaleFactor: 1 },
  d1280: { width: 1280, height: 800, deviceScaleFactor: 1 },
  m375: { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  m390: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  m430: { width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}

/** the journey states every viewport must pass */
const STATES = [
  ['hero', '/'],
  ['opening', '/?pose=0.165'],
  ['revealed', '/?pose=0.24'],
  ['reception', '/?pose=0.3'],
  ['previsit', '/?pose=0.36'],
  ['exam', '/?pose=0.47'],
  ['review', '/?pose=0.6'],
  ['follow-through', '/?pose=0.7'],
  ['ops-overhead', '/?pose=0.8'],
  ['closing', '/?pose=0.92'],
  ['final', '/?pose=1'],
]

const vpKeys = quick ? ['d1440', 'm375'] : Object.keys(VIEWPORTS)

fs.mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
})

async function settle(page) {
  await page.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, 1400))
}

try {
  const page = await browser.newPage()

  for (const vp of vpKeys) {
    await page.setViewport(VIEWPORTS[vp])
    for (const [state, route] of STATES) {
      await page.goto(base + route, { waitUntil: 'networkidle0' })
      await settle(page)
      await page.screenshot({ path: path.join(out, `${vp}-${state}.png`) })
      console.log(`captured ${vp}-${state}`)
    }
  }

  // fallbacks, modals, and text-size checks
  for (const vp of quick ? ['d1440', 'm375'] : ['d1440', 'm375']) {
    await page.setViewport(VIEWPORTS[vp])

    await page.goto(`${base}/?static=1`, { waitUntil: 'networkidle0' })
    await settle(page)
    await page.screenshot({ path: path.join(out, `${vp}-static-fallback.png`), fullPage: vp === 'd1440' })
    console.log(`captured ${vp}-static-fallback`)

    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.goto(base + '/', { waitUntil: 'networkidle0' })
    await settle(page)
    await page.screenshot({ path: path.join(out, `${vp}-reduced-motion.png`) })
    console.log(`captured ${vp}-reduced-motion`)
    await page.emulateMediaFeatures([])

    await page.goto(base + '/', { waitUntil: 'networkidle0' })
    await settle(page)
    await page.click('.nav-cta')
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(out, `${vp}-demo-modal.png`) })
    console.log(`captured ${vp}-demo-modal`)

    await page.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 400))
    await page.click('.copy-actions .btn-secondary')
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(out, `${vp}-waitlist-modal.png`) })
    console.log(`captured ${vp}-waitlist-modal`)
  }

  // increased browser text size approximation: larger root font size
  await page.setViewport(VIEWPORTS.d1440)
  await page.goto(base + '/?pose=0.8', { waitUntil: 'networkidle0' })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '20px'
  })
  await settle(page)
  await page.screenshot({ path: path.join(out, 'd1440-ops-textzoom.png') })
  console.log('captured d1440-ops-textzoom')
} finally {
  await browser.close()
}
