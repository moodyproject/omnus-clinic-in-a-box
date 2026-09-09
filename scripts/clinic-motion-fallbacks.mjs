import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base=process.argv[2]||'http://127.0.0.1:4190/omnus-clinic-in-a-box/'
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const results=[]
try{
 for(const mode of ['static','reduced','no-webgl','lost']){
  const page=await browser.newPage();await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true})
  let glbs=0;page.on('request',r=>{if(r.url().endsWith('.glb'))glbs++})
  if(mode==='reduced')await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])
  if(mode==='no-webgl')await page.evaluateOnNewDocument(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)}})
  await page.goto(base+(mode==='static'?'?static=1':''),{waitUntil:'networkidle0'})
  if(mode==='lost'){await page.$eval('canvas',c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())}
  await page.waitForSelector(['static','reduced'].includes(mode)?'canvas':'.scene-error');await new Promise(r=>setTimeout(r,500))
  const state=await page.evaluate(()=>({scenes:document.querySelectorAll('.static-scene, .clinic-static-image').length,canvas:!!document.querySelector('canvas'),overflow:document.documentElement.scrollWidth>innerWidth}))
  assert.equal(state.scenes,0);assert.equal(state.canvas,['static','reduced'].includes(mode));assert.equal(state.overflow,false)
  if(['static','reduced'].includes(mode))assert.ok(glbs>=5,'legacy static links and reduced motion must load real 3D')
  await page.click('.nav-cta');assert.ok(await page.$('[role="dialog"]'));results.push({mode,...state,glbs});await page.close()
 }
 console.log('PASS',results)
}finally{fs.writeFileSync('docs/evidence/clinic-motion/production-fallbacks.json',JSON.stringify(results,null,2));await browser.close()}
