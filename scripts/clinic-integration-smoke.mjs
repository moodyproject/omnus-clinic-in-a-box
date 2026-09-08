import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base=process.argv[2] || 'http://127.0.0.1:4181/omnus-clinic-in-a-box/'
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--force-color-profile=srgb']})
try{
 const page=await browser.newPage();await page.setViewport({width:1440,height:900,deviceScaleFactor:1})
 await page.goto(base+'?pose=0.47',{waitUntil:'networkidle0'})
 await new Promise(r=>setTimeout(r,1800))
 const result=await page.evaluate(()=>{
  const root=window.__omnus?.scene.getObjectByName('accepted-clinic')
  if(!root)return null
  const names=[];root.traverse(n=>names.push(n.name))
  return {scale:root.scale.toArray(),position:root.position.toArray(),names}
 })
 assert.ok(result,'accepted clinic must replace baseline geometry')
 assert.deepEqual(result.scale,[.1,.1,.1]);assert.ok(Math.abs(result.position[1]-.136)<1e-9)
 for(const n of ['physician-seated','patient-seated','Reception_Staff','Reception_Visitor','Review_Physician','Follow_Coordinator'])assert.ok(result.names.includes(n),n)
 assert.equal(result.names.filter(n=>n==='clinic-shell').length,1)
 fs.mkdirSync('docs/evidence/clinic-site-integration',{recursive:true})
 await page.screenshot({path:'docs/evidence/clinic-site-integration/first-integrated-exam.png'})
 console.log('PASS accepted clinic scale, floor offset, six people, one shell in actual R3F site')
}finally{await browser.close()}
