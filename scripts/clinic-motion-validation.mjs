import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base=process.argv[2]||'http://127.0.0.1:4190/'
const out=process.env.EVIDENCE_OUT||'docs/evidence/clinic-motion/validation';fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try{
 const page=await browser.newPage();await page.setViewport({width:1440,height:900,deviceScaleFactor:1});await page.goto(base+'?pose=.47',{waitUntil:'networkidle0'})
 await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('room-people'))
 const result=await page.evaluate(async()=>{
  const {createAcceptedMotion}=await import('/src/three/clinic/acceptedMotion.ts')
  const {loadAcceptedModel,disposeModel}=await import('/src/three/clinic/acceptedModel.ts')
  const s=window.__omnus;s.setFrameloop('never');const root=s.scene.getObjectByName('accepted-clinic')
  const motion=createAcceptedMotion(root)
  let boundsMisses=0,verticesChecked=0
  const snapshot=()=>{
   root.updateMatrixWorld(true);const bones=[],feet={}
   root.traverse(n=>{if(n.isBone)bones.push(...n.position.toArray(),...n.quaternion.toArray(),...n.scale.toArray());if(n.isSkinnedMesh){n.skeleton.update();let min=Infinity;const v=n.position.clone();for(let i=0;i<n.geometry.attributes.position.count;i++){n.getVertexPosition(i,v);verticesChecked++;if(n.frustumCulled&&(!n.boundingSphere||v.distanceTo(n.boundingSphere.center)>n.boundingSphere.radius+1e-6))boundsMisses++;if(n.name.includes('shoes01')){v.applyMatrix4(n.matrixWorld);min=Math.min(min,v.y)}}if(n.name.includes('shoes01'))feet[n.name]=min}})
   return {bones,feet}
  }
  const samples=[]
  for(const p of [.19,.225,.28,.34,.375,.395,.40,.4075,.415,.425,.43,.47,.495,.60,.615,.63,.65,.70,.78,.82,1]){motion.update(p);samples.push({p,...snapshot()})}
  const errors=[]
  for(const a of [...samples].reverse()){motion.update(a.p);const b=snapshot();const max=Math.max(...a.bones.map((x,i)=>Math.abs(x-b.bones[i])));if(max>1e-8)errors.push({p:a.p,max})}
  motion.update(.47);const hold=snapshot();for(let i=0;i<10;i++)motion.update(.47);const held=snapshot();const holdError=Math.max(...hold.bones.map((x,i)=>Math.abs(x-held.bones[i])))
  motion.dispose()
  const fresh=await loadAcceptedModel('/',()=>false);fresh.position.y=root.position.y
  const freshMotion=createAcceptedMotion(fresh);freshMotion.update(.47);fresh.updateMatrixWorld(true)
  const freshBones=[];fresh.traverse(n=>{if(n.isBone)freshBones.push(...n.position.toArray(),...n.quaternion.toArray(),...n.scale.toArray())})
  const freshError=Math.max(...freshBones.map((x,i)=>Math.abs(x-hold.bones[i])))
  freshMotion.dispose();disposeModel(fresh)
  return {boundsMisses,verticesChecked,reverseErrors:errors,holdError,freshError,feet:samples.map(({p,feet})=>({p,feet})),renderInfo:{calls:s.gl.info.render.calls,triangles:s.gl.info.render.triangles,geometries:s.gl.info.memory.geometries,textures:s.gl.info.memory.textures}}
 })
 fs.writeFileSync(`${out}/determinism-contacts.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))
 assert.equal(result.reverseErrors.length,0,'exact reverse bone state');assert.equal(result.holdError,0,'held scroll freezes pose');assert.ok(result.freshError<1e-8,'fresh rig equals scrubbing')
 assert.ok(result.verticesChecked>0);assert.equal(result.boundsMisses,0,'actual deformed vertices must remain in animated culling bounds')
 // 1.5cm real-scale tolerance for shoe skinning/mesh quantization; isolated
 // seated roles must stay at their accepted floor or 2.4cm waiting rug.
 for(const row of result.feet)for(const [name,y] of Object.entries(row.feet)){
  const floor=.136+(name.includes('Reception_Visitor')?.0024:0)
  assert.ok(y>=floor-.0015,`sole below floor ${row.p} ${name}: ${y}`)
  assert.ok(y<=floor+.003,`both feet airborne ${row.p} ${name}: ${y}`)
 }
}finally{await browser.close()}
