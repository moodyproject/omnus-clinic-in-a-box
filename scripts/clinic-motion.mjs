import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base=process.argv[2]||'http://127.0.0.1:4190/'
const out=process.argv[3]||'docs/evidence/clinic-motion/red'
fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--force-color-profile=srgb']})
const ids=['physician-seated','patient-seated','Reception_Staff','Reception_Visitor','Review_Physician','Follow_Coordinator']
const results=[]
try {
 const page=await browser.newPage();await page.setViewport({width:1440,height:900,deviceScaleFactor:1})
 for(const p of [.28,.34,.47,.495,.70,.82]){
  await page.goto(`${base}?pose=${p}`,{waitUntil:'networkidle0'})
  await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('room-people'))
  await new Promise(r=>setTimeout(r,200))
  const sample=await page.evaluate((ids)=>{
   const {scene,camera,gl}=window.__omnus
   window.__omnus.setFrameloop('never')
   scene.updateMatrixWorld(true)
   const actors=ids.map(id=>{
    const root=scene.getObjectByName(id),points=[]
    root.traverse(m=>{if(!m.isMesh)return;if(m.isSkinnedMesh)m.skeleton.update();for(let i=0;i<m.geometry.attributes.position.count;i+=37){const v=m.position.clone();m.getVertexPosition(i,v);v.applyMatrix4(m.matrixWorld);points.push(v.toArray())}})
    const center=[0,1,2].map(k=>points.reduce((s,p)=>s+p[k],0)/points.length)
    return {id,center,shape:points.map(v=>v.map((x,k)=>x-center[k]))}
   })
   // Same camera and fully lowered architecture in every evidence frame.
   camera.position.set(1.1,1.35,1.6);camera.lookAt(0,.17,0);camera.updateMatrixWorld(true);gl.render(scene,camera)
   return actors
  },ids)
  results.push({p,actors:sample});await page.screenshot({path:`${out}/desktop-${p}.png`})
 }
 fs.writeFileSync(`${out}/samples.json`,JSON.stringify(results))
 const a=results[2],b=results[3]
 const deltas=a.actors.map((actor,i)=>({id:actor.id,maxLimbDelta:Math.max(...actor.shape.map((v,j)=>Math.hypot(...v.map((x,k)=>x-b.actors[i].shape[j][k]))))}))
 const travel=Math.hypot(...results[0].actors[1].center.map((v,k)=>v-a.actors[1].center[k]))
 console.log(JSON.stringify({deltas,patientTravel:travel},null,2))
 assert.ok(deltas.every(d=>d.maxLimbDelta>.0005),'every accepted actor must articulate actual vertices, not move a frozen statue')
 assert.ok(travel>.15,'lead patient must travel to consultation, not remain seated throughout')
}finally{await browser.close()}
