// Browser checks for packed-asset failure, retry gate, recovery and timeout.
// usage: node scripts/cold-load-recovery.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const base = process.env.BASE || 'http://127.0.0.1:4312/'
const output = 'docs/evidence/cold-load/recovery.json'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, pipe: true })
const rows = []
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  await page.setCacheEnabled(false)
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  let fail = true
  let delay = false
  await page.setRequestInterception(true)
  page.on('request', r => {
    if (!r.url().endsWith('.zst')) return r.continue()
    if (fail) return r.abort()
    if (delay) return setTimeout(() => r.continue().catch(() => {}), 3500)
    return r.continue()
  })
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-scene-reason="asset-load"]', { timeout: 15000 })
  await page.waitForFunction(() => !document.getElementById('boot'))
  assert.equal(await page.$('canvas'), null)
  await page.mouse.wheel({ deltaY: 700 })
  await new Promise(r => setTimeout(r, 150))
  const failureScroll = await page.evaluate(() => scrollY)
  assert.ok(failureScroll > 0, 'failure must release scroll gate for fallback content')
  rows.push({ check: 'asset failure reveals fallback and releases gate', passed: true })

  fail = false
  delay = true
  await page.click('[data-action="retry-3d"]')
  await page.waitForSelector('canvas')
  const before = await page.evaluate(() => scrollY)
  await page.mouse.wheel({ deltaY: 700 })
  await page.keyboard.press('PageDown')
  const touch = await page.touchscreen.touchStart(190, 700)
  for (const y of [650, 590, 530, 470, 410]) {
    await touch.move(190, y)
    await new Promise(r => setTimeout(r, 25))
  }
  await touch.end()
  await new Promise(r => setTimeout(r, 200))
  assert.equal(await page.evaluate(() => scrollY), before, 'retry must re-lock wheel, keys and touch')
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.journey-canvas')).visibility), 'hidden')
  rows.push({ check: 'retry keeps scroll locked and incomplete scene hidden', passed: true })
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.journey-canvas')).visibility === 'visible', { timeout: 30000 })
  await page.mouse.wheel({ deltaY: 700 })
  await new Promise(r => setTimeout(r, 150))
  assert.ok(await page.evaluate(() => scrollY) > before)
  rows.push({ check: 'retry recovers and releases scroll after ready', passed: true })
  await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await page.waitForSelector('[data-scene-reason="context-lost"]')
  assert.ok(await page.$('[data-action="retry-3d"]'))
  rows.push({ check: 'context loss remains recoverable', passed: true })
  delay = false
  await page.click('[data-action="retry-3d"]')
  await page.waitForFunction(() => document.querySelector('.journey-canvas') && getComputedStyle(document.querySelector('.journey-canvas')).visibility === 'visible', { timeout: 30000 })
  await page.evaluate(() => document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await page.waitForSelector('[data-scene-reason="context-lost"]')
  assert.equal(await page.$('[data-action="retry-3d"]'), null)
  rows.push({ check: 'two-retry ceiling remains intact', passed: true })
  await page.close()

  const timeoutPage = await browser.newPage()
  await timeoutPage.setViewport({ width: 390, height: 844 })
  await timeoutPage.setCacheEnabled(false)
  timeoutPage.on('pageerror', e => errors.push(String(e)))
  await timeoutPage.evaluateOnNewDocument(() => {
    const original = window.setTimeout.bind(window)
    window.setTimeout = (fn, ms, ...args) => original(fn, ms === 45000 ? 700 : ms, ...args)
  })
  await timeoutPage.setRequestInterception(true)
  timeoutPage.on('request', r => {
    if (!r.url().endsWith('.zst')) return r.continue()
    return setTimeout(() => r.continue().catch(() => {}), 1800)
  })
  await timeoutPage.goto(base, { waitUntil: 'domcontentloaded' })
  await timeoutPage.waitForSelector('[data-scene-reason="asset-timeout"]', { timeout: 15000 })
  await new Promise(r => setTimeout(r, 2300))
  assert.ok(await timeoutPage.$('[data-scene-reason="asset-timeout"]'))
  assert.equal(await timeoutPage.$('canvas'), null)
  rows.push({ check: 'timeout aborts pack and late response does not revive scene', passed: true })
  assert.deepEqual(errors, [])
  fs.writeFileSync(output, JSON.stringify({ rows, errors }, null, 2) + '\n')
  console.log(JSON.stringify(rows))
} finally { await browser.close() }
