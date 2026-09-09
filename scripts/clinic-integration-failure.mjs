import assert from 'node:assert/strict'
import puppeteer from 'puppeteer-core'
const base=process.argv[2]||'http://127.0.0.1:4181/omnus-clinic-in-a-box/'
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try {
 const page=await browser.newPage()
 await page.setRequestInterception(true)
 page.on('request',r=>r.url().includes('room-people.glb')?r.abort():r.continue())
 await page.goto(base,{waitUntil:'networkidle0'})
 await new Promise(r=>setTimeout(r,2000))
 assert.ok(await page.$('[data-scene-reason="asset-load"]'),'asset failure must show an honest error')
 assert.equal(await page.$('.static-journey, .clinic-static-image, canvas'),null)
 assert.ok(await page.$('[data-action="retry-3d"]'))
 await page.click('.nav-cta');assert.ok(await page.$('[role="dialog"]'))
 console.log('PASS missing additional-people asset shows error/Retry with functional CTA, no static site')
} finally {await browser.close()}
