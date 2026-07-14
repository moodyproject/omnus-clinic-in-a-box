/**
 * one-off screenshot helper for qa iteration.
 * usage: node scripts/shot.mjs <url> <out.png> [width] [height] [scale]
 */
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const [url, out, w = '1440', h = '900', scale = '1', clipStr] = process.argv.slice(2)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
})
try {
  const page = await browser.newPage()
  await page.setViewport({
    width: Number(w),
    height: Number(h),
    deviceScaleFactor: Number(scale),
    isMobile: Number(w) < 700,
    hasTouch: Number(w) < 700,
  })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, 1400))
  const clip = clipStr
    ? (() => {
        const [x, y, cw, ch] = clipStr.split(',').map(Number)
        return { x, y, width: cw, height: ch }
      })()
    : undefined
  await page.screenshot({ path: out, clip })
  console.log(`captured ${out}`)
} finally {
  await browser.close()
}
