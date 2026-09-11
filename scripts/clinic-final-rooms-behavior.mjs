import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const out='docs/evidence/doctor-journey/final-rooms'
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try{
const page=await browser.newPage();await page.setViewport({width:1440,height:900});await page.goto('http://127.0.0.1:4202/',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('physician-seated'))
const result=await page.evaluate(async()=>{
 const s=window.__omnus;s.setFrameloop('never');const root=s.scene.getObjectByName('accepted-clinic'),actor=root.getObjectByName('physician-seated');const{createAcceptedMotion}=await import('/src/three/clinic/acceptedMotion.ts');const motion=createAcceptedMotion(root)
 const bones=[];root.traverse(n=>{if(n.isBone&&(n.userData.name??n.name)==='root')bones.push(n)})
 const find=(a,name)=>{let b;a.traverse(n=>{if(n.isBone&&(n.userData.name??n.name)===name)b=n});return b};const dr=find(actor,'root'),patient=find(root.getObjectByName('patient-seated'),'root')
 const actors=bones.filter(b=>b!==dr);const gaps={};let step=0,prev,patientSpread=0,patientAnchor;const samples=[];let boundsMisses=0,boundsChecked=0
 for(let i=190;i<=790;i++){
  const p=i/1000;motion.update(p);s.scene.updateMatrixWorld(true);const d=dr.getWorldPosition(dr.position.clone()),pat=patient.getWorldPosition(patient.position.clone());patientAnchor??=pat.clone();patientSpread=Math.max(patientSpread,pat.distanceTo(patientAnchor));if(prev)step=Math.max(step,d.distanceTo(prev));prev=d
  for(const b of actors){const v=b.getWorldPosition(b.position.clone()),gap=Math.hypot(d.x-v.x,d.z-v.z);const key=b.parent.name;if(!gaps[key]||gap<gaps[key].gap)gaps[key]={gap,p}}
  if([300,389,480,525,545,565,585,605,625,637,651,675,695,725,746,765].includes(i)){
   const pose={};actor.traverse(n=>{if(n.isBone)pose[n.userData.name??n.name]={world:n.getWorldPosition(n.position.clone()).toArray(),q:n.quaternion.toArray()}})
   const chart=actor.getObjectByName('physician-clinical-chart');samples.push({p,pose,chart:{visible:chart.visible,state:chart.userData.state,world:chart.getWorldPosition(chart.position.clone()).toArray()}})
   actor.traverse(n=>{if(!n.isSkinnedMesh)return;n.skeleton.update();const v=n.position.clone();for(let k=0;k<n.geometry.attributes.position.count;k+=9){n.getVertexPosition(k,v);boundsChecked++;if(v.distanceTo(n.boundingSphere.center)>n.boundingSphere.radius+1e-6)boundsMisses++}})
  }
 }
 const ref=samples.find(s=>s.p===.651);let repeatError=0;for(const p of [0,1,.651,.765,.651,.651]){motion.update(p);s.scene.updateMatrixWorld(true);if(p===.651)actor.traverse(n=>{if(n.isBone){const v=n.getWorldPosition(n.position.clone());v.toArray().forEach((x,i)=>repeatError=Math.max(repeatError,Math.abs(x-ref.pose[n.userData.name??n.name].world[i])))}})}
 motion.dispose();return{gaps,step,patientSpread,boundsMisses,boundsChecked,repeatError,samples}
});fs.writeFileSync(`${out}/behavior.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({gaps:result.gaps,step:result.step,patientSpread:result.patientSpread,boundsMisses:result.boundsMisses,boundsChecked:result.boundsChecked,repeatError:result.repeatError,states:result.samples.filter(s=>s.chart.visible).map(s=>[s.p,s.chart.state,s.chart.world])}));assert(result.patientSpread<1e-8);assert(result.repeatError<1e-8);assert.equal(result.boundsMisses,0);assert(result.step<.03);assert(Object.values(result.gaps).every(g=>g.gap>.05));assert.equal(result.samples.find(s=>s.p===.651).chart.state,'APPROVED');assert.equal(result.samples.find(s=>s.p===.765).chart.state,'HANDOFF')
}finally{await browser.close()}
