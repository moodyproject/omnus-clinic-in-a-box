import fs from 'node:fs'
import assert from 'node:assert/strict'
import puppeteer from 'puppeteer-core'
const out='docs/evidence/natural-motion';fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4202/?pose=.49',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('Transcription_Agent')&&window.__omnus.get().internal.frames===0)
 const result=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js'),s=window.__omnus,root=s.scene.getObjectByName('accepted-clinic');s.setFrameloop('never')
  const {createAcceptedMotion}=await import('/src/three/clinic/acceptedMotion.ts'),motion=createAcceptedMotion(root),nodes=[]
  root.traverse(n=>{if((n.isBone&&/^(root|head|spine|upperarm|lowerarm|wrist|upperleg|lowerleg|foot)/.test(n.userData.name??n.name))||n.name==='physician-clinical-chart'||n.name==='scribe-right-hand'||n.name==='scribe-head'||n.name.includes('__robot__wrist'))nodes.push(n)})
  const label=n=>{let actor=n;while(actor.parent&&actor.parent!==root&&!['Reception_Staff','Reception_Visitor','Review_Physician','Follow_Coordinator','Review_Visitor','Follow_Visitor'].includes(actor.name))actor=actor.parent;return `${actor.name}/${n.userData.name??n.name}`}
  const events=[],seams=[],pos=new T.Vector3();let before=null
  const sample=p=>{motion.update(p);root.updateMatrixWorld(true);return nodes.map(n=>({id:label(n),q:n.quaternion.toArray(),pos:root.worldToLocal(n.getWorldPosition(pos)).toArray()}))}
  for(let i=160;i<=850;i++){
   const p=i/1000,now=sample(p)
   if(before)for(let j=0;j<now.length;j++){const a=before[j],b=now[j],angle=2*Math.acos(Math.min(1,Math.abs(a.q.reduce((v,x,k)=>v+x*b.q[k],0)))),distance=Math.hypot(...a.pos.map((v,k)=>v-b.pos[k]));if(angle>.08||distance>.08)events.push({p,id:b.id,angle,distance})}
   before=now
  }
  for(const p of [.365,.435,.44,.465,.475,.525,.545,.615,.618,.658,.66,.710,.715,.718,.779,.78,.787]){
   const a=sample(p-.000001),b=sample(p+.000001),changed=[]
   for(let j=0;j<b.length;j++){const distance=Math.hypot(...a[j].pos.map((v,k)=>v-b[j].pos[k]));if(distance>.002)changed.push({id:b[j].id,distance})}
   seams.push({p,changed})
  }
  return{samples:691,nodes:nodes.length,events:events.sort((a,b)=>b.distance-a.distance),seams}
 })
 fs.writeFileSync(`${out}/${process.argv.includes('--record')?'baseline':'candidate'}-seams.json`,JSON.stringify(result,null,2))
 console.log(JSON.stringify({samples:result.samples,nodes:result.nodes,largest:result.events.slice(0,12),discontinuities:result.seams.filter(s=>s.changed.length)},null,2))
 if(!process.argv.includes('--record'))assert(result.seams.every(s=>s.changed.filter(c=>!c.id.endsWith('/physician-clinical-chart')).length===0),'no instantaneous actor pose jumps at role transitions')
}finally{await browser.close()}
