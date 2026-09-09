import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base = process.env.BASE_URL || 'http://127.0.0.1:4206/'
const phase = process.env.PHASE || 'entry'
const out = `docs/evidence/3d-only/${phase}`
fs.mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const rows = []
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
try {
 for (const width of [1440, 390]) {
  const page = await browser.newPage()
  await page.setCacheEnabled(false)
  await page.setViewport({ width, height: width === 390 ? 844 : 1000, isMobile: width === 390, hasTouch: width === 390 })
  const assets = new Set(), errors = []
  page.on('response', r => { if (r.url().endsWith('.glb') && r.ok()) assets.add(new URL(r.url()).pathname) })
  page.on('pageerror', e => errors.push(String(e)))
  if (phase === 'entry') await page.evaluateOnNewDocument(() => { localStorage.setItem('unrelated-preference', 'static'); sessionStorage.setItem('unrelated-session', 'static'); Object.defineProperty(navigator, 'connection', { value: { saveData: true } }) })
  await page.goto(base + (phase === 'entry' ? '?static=1' : ''), { waitUntil: 'networkidle0' })
  if (phase === 'entry') assert.equal(await page.$('.static-journey'), null, 'legacy static choice must enter 3D automatically')
  await page.waitForSelector('canvas')
  for (let n = 0; assets.size < 5 && n < 100; n++) await wait(100)
  assert.equal(assets.size, 5)
  if (phase === 'entry') {
   assert.equal(await page.$('[data-action="view-static"], [data-action="enable-3d"]'), null)
   assert.deepEqual(await page.evaluate(() => [localStorage.getItem('unrelated-preference'), sessionStorage.getItem('unrelated-session')]), ['static', 'static'])
  }
  const shots = []
  for (const [name, p] of [['hero', 0], ['reception', .30], ['consult', .47], ['review', .60], ['follow', .71], ['overview', .82]]) {
   await page.evaluate(p => { const e = document.querySelector('.journey'); scrollTo(0, e.offsetTop + (e.offsetHeight - innerHeight) * p) }, p)
   await wait(1800)
   const path = `${out}/${width}-${name}.png`
   await page.screenshot({ path }); shots.push(path)
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  }
  assert.deepEqual(errors, [])
  rows.push({ width, assets: [...assets], errors, shots, pass: true })
  fs.writeFileSync(`${out}/results.json`, JSON.stringify(rows, null, 2))
  await page.close()
 }
 assert.equal(rows.length, 2)
 console.log('PASS', JSON.stringify(rows))
} catch (error) {
 rows.push({ pass: false, failure: String(error) }); console.error(error); process.exitCode = 1
} finally { fs.writeFileSync(`${out}/results.json`, JSON.stringify(rows, null, 2)); await browser.close() }
