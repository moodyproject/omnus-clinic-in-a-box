import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try {
 const page=await browser.newPage();await page.setViewport({width:1440,height:900})
 await page.goto('http://127.0.0.1:4202/?pose=.49',{waitUntil:'networkidle0'})
 await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('Transcription_Agent')&&window.__omnus.get().internal.frames===0)
 const result=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js'),root=window.__omnus.scene.getObjectByName('accepted-clinic'),a=root.getObjectByName('Transcription_Agent')
  const {createTranscriptionAgent}=await import('/src/three/clinic/transcriptionAgent.ts'),update=createTranscriptionAgent(root),rows=[]
  for(const p of [.40,.475,.49,.505,.55]) {
   update(p);root.updateMatrixWorld(true)
   const tablet=a.getObjectByName('scribe-tablet'),face=a.getObjectByName('scribe-visor'),hand=a.getObjectByName('scribe-right-hand'),pen=a.getObjectByName('scribe-stylus')
   const center=tablet.getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,0,1).transformDirection(tablet.matrixWorld),toFace=face.getWorldPosition(new T.Vector3()).sub(center).normalize()
   const tip=tablet.worldToLocal(pen.localToWorld(new T.Vector3(0,-.075,0)))
   rows.push({p,facing:normal.dot(toFace),handSide:hand.getWorldPosition(new T.Vector3()).sub(center).dot(normal),tip:tip.toArray()})
  }
  update(.49);return rows
 })
 fs.writeFileSync('docs/evidence/transcription-agent/tablet-orientation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result))
 assert(result.every(r=>r.facing>.9),'screen must face the robot, not the people')
 assert(result.every(r=>r.handSide>0),'writing hand must stay on the screen side')
 assert(result.every(r=>Math.abs(r.tip[0])<.15&&Math.abs(r.tip[1])<.11&&Math.abs(r.tip[2]-.024)<1e-6),'stylus tip must stay on tablet note surface')
}finally{await browser.close()}
