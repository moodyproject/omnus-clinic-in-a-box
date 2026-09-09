import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
const { webkit } = createRequire('/Users/moud/.hermes/hermes-agent/package.json')('playwright')
const out='docs/evidence/iphone-safari';fs.mkdirSync(out,{recursive:true})
const browser=await webkit.launch({headless:true})
const rows=[]
try {
 for(const [width,height] of [[390,844],[375,667],[430,932]]) {
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:3})
  await page.goto('http://127.0.0.1:4198/',{waitUntil:'networkidle'})
  await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('room-people'))
  await page.waitForTimeout(1000)
  const row=await page.evaluate(()=>{
   const s=window.__omnus;s.camera.updateMatrixWorld(true)
   const corners=[-.68,.68].flatMap(x=>[0,.942].flatMap(y=>[-.68,.68].map(z=>{const p=s.camera.position.clone().set(x,y,z).project(s.camera);return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}})))
   const nav=document.querySelector('.nav').getBoundingClientRect(),copy=document.querySelector('[data-scene="object"] .copy-inner').getBoundingClientRect()
   return{width:innerWidth,height:innerHeight,top:nav.bottom+8,bottom:copy.top-8,corners,images:document.images.length,sceneError:document.querySelector('.scene-error')?.textContent}
  })
  rows.push(row);fs.writeFileSync(`${out}/framing-${process.argv[2]||'after'}.json`,JSON.stringify(rows,null,2))
  console.log(JSON.stringify(row))
  assert.ok(row.corners.every(p=>p.x>=12&&p.x<=width-12),'whole opening box must fit phone width')
  assert.ok(row.corners.every(p=>p.y>=row.top&&p.y<=row.bottom),'whole opening box must fit between navigation and copy')
  assert.equal(row.images,0);assert.equal(row.sceneError,undefined)
  await page.close()
 }
}finally{await browser.close()}
