import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const out='docs/evidence/two-hand-chart';fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try{
 const page=await browser.newPage();await page.setViewport({width:1440,height:900});await page.goto('http://127.0.0.1:4202/?pose=.745',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('physician-clinical-chart')&&window.__omnus.get().internal.frames===0)
 const result=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js'),s=window.__omnus,root=s.scene.getObjectByName('accepted-clinic'),actor=root.getObjectByName('physician-seated'),body=actor.getObjectByName('Physician_Body'),chart=actor.getObjectByName('physician-clinical-chart')
  const {createAcceptedMotion}=await import('/src/three/clinic/acceptedMotion.ts'),motion=createAcceptedMotion(root)
  const g=body.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,idx=g.index,bySide={L:new Set(),R:new Set()},tris=[]
  for(let i=0;i<si.count;i++)for(let k=0;k<4;k++){const n=body.skeleton.bones[si.getComponent(i,k)],name=n.userData.name??n.name;if(sw.getComponent(i,k)>.15&&/wrist|finger|metacarpal/.test(name))bySide[name.endsWith('.L')?'L':'R'].add(i)}
  for(let i=0;i<(idx?idx.count:si.count);i+=3){const ids=[0,1,2].map(j=>idx?idx.getX(i+j):i+j);if(ids.some(v=>bySide.L.has(v)||bySide.R.has(v)))tris.push(ids)}
  const rows=[],box=new T.Box3(new T.Vector3(-.215,-.009,-.155),new T.Vector3(.215,.012,.155)),tri=new T.Triangle(),v=new T.Vector3(),inverse=new T.Matrix4()
  s.setFrameloop('never')
  for(const p of Array.from({length:62},(_,i)=>(718+i)/1000)){
   const started=performance.now();motion.update(p);const updateMs=performance.now()-started;s.scene.updateMatrixWorld(true);body.skeleton.update();inverse.copy(chart.matrixWorld).invert().multiply(body.matrixWorld)
   const positions=new Map(),distances={L:Infinity,R:Infinity},sides={L:[],R:[]}
   for(const side of ['L','R'])for(const id of bySide[side]){body.getVertexPosition(id,v).applyMatrix4(inverse);positions.set(id,v.clone());const d=box.distanceToPoint(v);distances[side]=Math.min(distances[side],d);if(d<.025)sides[side].push(v.x)}
   let intersections=0
   for(const ids of tris){const points=ids.map(id=>positions.get(id)??body.getVertexPosition(id,new T.Vector3()).applyMatrix4(inverse));tri.set(...points);if(box.intersectsTriangle(tri))intersections++}
   const normal=new T.Vector3(0,1,0).transformDirection(chart.matrixWorld)
   rows.push({p,distances,intersections,updateMs,up:normal.y,nearEdge:{L:sides.L.length?Math.min(...sides.L):null,R:sides.R.length?Math.max(...sides.R):null}})
  }
  motion.update(.745);s.scene.updateMatrixWorld(true);s.gl.render(s.scene,s.camera);return rows
 })
 fs.writeFileSync(`${out}/${process.argv.includes('--record')?'baseline':'verification'}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({samples:result.length,maxGap:Math.max(...result.flatMap(r=>Object.values(r.distances))),intersections:result.reduce((n,r)=>n+r.intersections,0),meanUpdateMs:result.reduce((n,r)=>n+r.updateMs,0)/result.length}))
 await page.screenshot({path:`${out}/desktop.png`})
 const replay=await page.evaluate(async()=>{
  const s=window.__omnus,root=s.scene.getObjectByName('accepted-clinic'),actor=root.getObjectByName('physician-seated')
  const {createAcceptedMotion}=await import('/src/three/clinic/acceptedMotion.ts'),motion=createAcceptedMotion(root)
  const sample=p=>{motion.update(p);s.scene.updateMatrixWorld(true);const a=[];actor.traverse(n=>{if(n.isBone)a.push(...n.quaternion.toArray())});return a}
  const before=sample(.49),held=sample(.745);sample(.779);const repeated=sample(.745),after=sample(.49)
  const error=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])))
  return {repeatError:error(held,repeated),outsideError:error(before,after)}
 })
 fs.writeFileSync(`${out}/replay.json`,JSON.stringify(replay,null,2));console.log(JSON.stringify(replay))
 assert(replay.repeatError<1e-8&&replay.outsideError<1e-8,'repeat/reverse seeking restores authored poses without accumulating finger/arm edits')
 await page.setViewport({width:390,height:844});await page.goto('http://127.0.0.1:4202/?pose=.745',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('physician-clinical-chart')&&window.__omnus.get().internal.frames===0);await page.screenshot({path:`${out}/phone.png`})
 assert(result.every(r=>r.distances.L<.003&&r.distances.R<.003),'both hands must actually meet the sheet edges')
 assert(result.every(r=>r.intersections===0),'sheet must not intersect actual hand skin triangles')
 assert(result.every(r=>r.up>.8),'sheet stays face-up, not palm-rolled')
}finally{await browser.close()}
