import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE_URL || 'http://127.0.0.1:4198/'
const phase = process.argv[2] || 'local'
const out = 'docs/evidence/copy-left'
fs.mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const rows = []
try {
  for (const width of [1440, 901, 390]) {
    const page = await browser.newPage()
    await page.setViewport({ width, height: width === 390 ? 844 : 900, isMobile: width === 390 })
    const errors = []
    page.on('pageerror', error => errors.push(String(error)))
    await page.goto(base, { waitUntil: 'networkidle0' })
    await page.waitForSelector('.copy-block')
    const blocks = await page.$$eval('.copy-block', els => els.map(el => {
      const rect = el.getBoundingClientRect(), inner = el.querySelector('.copy-inner').getBoundingClientRect()
      return { scene: el.dataset.scene, side: el.dataset.side, left: rect.left, right: rect.right, innerLeft: inner.left, heading: el.querySelector('.copy-heading').textContent, body: el.querySelector('.copy-body').textContent }
    }))
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    rows.push({ width, blocks, overflow, errors })
    fs.writeFileSync(`${out}/${phase}.json`, JSON.stringify(rows, null, 2))
    assert.equal(blocks.length, 8)
    assert.equal(new Set(blocks.map(block => block.scene)).size, 8)
    for (const block of blocks) {
      assert.equal(block.side, 'left', `${block.scene} must use the left column`)
      assert.ok(Math.abs(block.left - blocks[0].left) < 1, `${block.scene} must share the left edge`)
      assert.ok(block.left >= 0 && block.right <= width + 1, `${block.scene} must stay within viewport`)
    }
    if (width === 390) assert.equal(blocks[0].left, 0, 'preserve full-width mobile bottom panels')
    assert.equal(overflow, false)
    assert.deepEqual(errors, [])
    await page.close()
  }
  console.log(JSON.stringify(rows.map(({ width, blocks, overflow, errors }) => ({ width, scenes: blocks.length, allLeft: blocks.every(b => b.side === 'left'), overflow, errors }))))
} finally { await browser.close() }
