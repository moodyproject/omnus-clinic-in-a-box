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
 assert.ok(await page.$('.static-journey'),'asset failure must restore real static journey, not empty rooms')
 const image=await page.$eval('.clinic-static-image',i=>({complete:i.complete,width:i.naturalWidth,src:i.src}))
 assert.ok(image.complete&&image.width>0)
 assert.ok(image.src.includes('/omnus-clinic-in-a-box/models/'))
 await page.click('.nav-cta');assert.ok(await page.$('[role="dialog"]'))
 console.log('PASS missing additional-people asset shows truthful static model/story with functional CTA')
} finally {await browser.close()}
