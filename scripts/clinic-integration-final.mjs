import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const local='http://127.0.0.1:4180/omnus-clinic-in-a-box/'
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
const results=[];const wait=ms=>new Promise(r=>setTimeout(r,ms))
try{
 for(const base of [local,'https://moodyproject.github.io/omnus-clinic-in-a-box/']){
  const p=await browser.newPage();await p.setViewport({width:1440,height:900});await p.goto(base,{waitUntil:'networkidle0'});await wait(700)
  await p.click('.skip-tour');await wait(300);await p.click('.wordmark');await wait(3000)
  const top=await p.evaluate(()=>scrollY)
  await p.evaluate(()=>[...document.querySelectorAll('.nav-link')].find(e=>e.textContent==='vision').click());await wait(3000)
  const vision=await p.evaluate(()=>({y:scrollY,ratio:scrollY/(document.querySelector('.journey').offsetHeight-innerHeight),copy:[...document.querySelectorAll('.copy-block')].map(e=>({scene:e.dataset.scene,opacity:getComputedStyle(e).opacity}))}))
  results.push({base,top,vision});console.log({base,top,vision});await p.close()
 }
 assert.equal(results[0].top,0);assert.equal(results[1].top,0)
 assert.ok(Math.abs(results[0].vision.ratio-.8)<.002)
 assert.deepEqual(results[0].vision.copy,results[1].vision.copy,'vision behavior matches live baseline')
 for(const mode of ['reduced','no-webgl','lost']){
  const p=await browser.newPage();await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true})
  if(mode==='reduced')await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])
  if(mode==='no-webgl')await p.evaluateOnNewDocument(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)}})
  await p.goto(local,{waitUntil:'networkidle0'});await wait(700)
  if(mode==='lost'){await p.$eval('canvas',c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await wait(1200)}
  const result=await p.evaluate(()=>({scenes:document.querySelectorAll('.static-scene').length,canvas:!!document.querySelector('canvas'),image:document.querySelector('.clinic-static-image')?.naturalWidth,overflow:document.documentElement.scrollWidth>innerWidth}))
  assert.equal(result.scenes,7);assert.equal(result.canvas,false);assert.ok(result.image>0);assert.equal(result.overflow,false)
  await p.click('.nav-cta');assert.ok(await p.$('[role="dialog"]'))
  results.push({mode,...result});await p.close()
 }
 console.log('PASS local/live nav equivalence; real reduced-motion, WebGL unavailable and context loss with static image and CTA')
}finally{fs.writeFileSync('docs/evidence/clinic-site-integration/decisive-checks.json',JSON.stringify(results,null,2));await browser.close()}
