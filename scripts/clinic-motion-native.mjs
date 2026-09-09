import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base=process.argv[2]||'http://127.0.0.1:4190/'
const out=process.env.EVIDENCE_OUT||'docs/evidence/clinic-motion/native';fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
const wait=ms=>new Promise(r=>setTimeout(r,ms));const reports=[]
try{
 for(const width of [1440,390,375]){
  const page=await browser.newPage();await page.setViewport({width,height:width===1440?900:844,deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500})
  const errors=[];page.on('pageerror',e=>errors.push(String(e)))
  await page.goto(base,{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('room-people'))
  const settled=async(expected=null)=>{
   await page.evaluate(async()=>{window.motionProgress=await import('/src/scroll/journey.ts')})
   await page.waitForFunction(expected=>(expected===null||Math.abs(window.motionProgress.journeyState.p-expected)<.0005)&&Math.abs(window.motionProgress.smoothedState.p-window.motionProgress.journeyState.p)<1e-10,{timeout:15000},expected)
   await wait(100)
  }
  const state=()=>page.evaluate(()=>{
   const root=window.__omnus.scene.getObjectByName('accepted-clinic');root.updateMatrixWorld(true)
   const bones=[];root.traverse(n=>{if(n.isBone)bones.push(...n.position.toArray(),...n.quaternion.toArray())})
   return {y:scrollY,p:window.motionProgress.smoothedState.p,bones,overflow:document.documentElement.scrollWidth>innerWidth,render:{calls:window.__omnus.gl.info.render.calls,triangles:window.__omnus.gl.info.render.triangles}}
  })
  const scroll=async p=>{await page.evaluate(p=>{const e=document.querySelector('.journey');scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*p)},p);await wait(100);await settled(p);return state()}
  await scroll(.28);const first=await scroll(.47);await page.screenshot({path:`${out}/${width}-consult.png`})
  await scroll(.78);const reverse=await scroll(.47)
  await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('room-people'));await settled();const reload=await state()
  const error=(a,b)=>Math.max(...a.bones.map((v,i)=>Math.abs(v-b.bones[i])))
  const row={width,progress:[first.p,reverse.p,reload.p],reverseBoneError:error(first,reverse),reloadBoneError:error(first,reload),reloadScrollDelta:reload.y-first.y,overflow:reload.overflow,errors,render:reload.render}
  console.log(row);reports.push(row)
  assert.ok(row.reverseBoneError<.0001&&row.reloadBoneError<.0001,'native forward/reverse/reload transforms')
  assert.ok(Math.abs(row.reloadScrollDelta)<2&&!row.overflow&&errors.length===0)
  await page.close()
 }
}finally{fs.writeFileSync(`${out}/results.json`,JSON.stringify(reports,null,2));await browser.close()}
