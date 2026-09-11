import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const out='docs/evidence/robot-agents'
fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try {
 const page=await browser.newPage()
 await page.setViewport({width:1440,height:900})
 await page.goto('http://127.0.0.1:4202/?pose=0.32',{waitUntil:'networkidle0'})
 await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('room-people')&&window.__omnus.get().internal.frames===0)
 const report=await page.evaluate(()=>{
  const s=window.__omnus;const ids=['Reception_Staff','Review_Physician','Follow_Coordinator']
  return {visitorIdentity:s.scene.getObjectByName('Reception_Visitor').userData.patientIdentity,render:{...s.gl.info.render},actors:ids.map(id=>{const a=s.scene.getObjectByName(id);const meshes=[],bones=[];a.traverse(n=>{if(n.isMesh)meshes.push({name:n.name,visible:n.visible,robot:!!n.userData.robotPart});if(n.isBone&&/^(head|spine|neck|upperarm01|lowerarm01|wrist|upperleg01|lowerleg01|foot|root)/.test(n.userData.name??n.name))bones.push({name:n.userData.name??n.name,local:n.position.toArray(),world:n.getWorldPosition(n.position.clone()).toArray()})});return{id,style:a.userData.robotStyle,robot:a.userData.representation,meshes,bones}})}
 })
 fs.writeFileSync(`${out}/${process.env.BASELINE?'red':'structure'}.json`,JSON.stringify(report,null,2))
 console.log(JSON.stringify(report))
 assert.equal(report.actors.filter(a=>a.robot==='omnus-robot').length,3,'three mechanical robot representations required')
 assert.equal(report.visitorIdentity,'female-patient','visitor uses the existing female patient identity')
 assert(report.actors.every(a=>a.style==='cylindrical-humanoid'),'agents are cylindrical humanoids')
 for(const actor of report.actors){assert(actor.meshes.some(m=>m.robot&&m.visible));assert(!actor.meshes.some(m=>!m.robot&&m.visible),'original human renderables must be hidden')}
} finally {await browser.close()}
