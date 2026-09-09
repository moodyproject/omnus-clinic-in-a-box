import assert from 'node:assert/strict'
import puppeteer from 'puppeteer-core'
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try {
 const page=await browser.newPage(); await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true})
 await page.goto('http://127.0.0.1:4198/?pose=.82',{waitUntil:'networkidle0'}); await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('room-people')); await new Promise(resolve=>setTimeout(resolve,1200))
 const points=await page.evaluate(()=>{const s=window.__omnus;s.camera.updateMatrixWorld();return [-.68,.68].flatMap(x=>[-.68,.68].map(z=>{const v=s.camera.position.clone().set(x,.136,z).project(s.camera);return[(v.x+1)*195,(1-v.y)*422]}))})
 console.log(points); assert.ok(points.every(([x])=>x>=12&&x<=378),'overview physical footprint must fit with >=12 CSS px side margin')
} finally {await browser.close()}
