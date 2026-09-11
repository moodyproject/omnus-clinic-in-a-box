import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try {
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4202/?pose=.32',{waitUntil:'networkidle0'})
 await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('Reception_Visitor')?.userData.patientIdentity&&window.__omnus.get().internal.frames===0)
 const report=await page.evaluate(async()=>{
  const s=window.__omnus;s.setFrameloop('never');const root=s.scene.getObjectByName('accepted-clinic'),people=s.scene.getObjectByName('room-people')
  const patient=s.scene.getObjectByName('patient-seated'),visitor=s.scene.getObjectByName('Reception_Visitor'),staff=s.scene.getObjectByName('Reception_Staff')
  const meshes=a=>{const r=[];a.traverse(n=>{if(n.isSkinnedMesh)r.push(n)});return r}
  const originals=meshes(patient),cloned=meshes(visitor),source=meshes(staff)
  const key=n=>n.userData.MPFB_GEN_asset_source??n.userData.MPFB_GEN_object_type
  const identity=cloned.map(n=>{const p=originals.find(p=>key(p)===key(n)),donor=source.find(p=>key(p)===key(n));const a=n.geometry.attributes.position,b=p.geometry.attributes.position;let maxPositionDelta=0;if(a.count===b.count)for(let i=0;i<a.count;i++)for(let k=0;k<3;k++)maxPositionDelta=Math.max(maxPositionDelta,Math.abs(a.getComponent(i,k)-b.getComponent(i,k)));return{part:key(n),vertices:a.count,matchingVertexCount:a.count===b.count,maxPositionDelta,sameActualMaterial:n.material===p.material,independentSkeleton:n.skeleton!==p.skeleton&&n.skeleton!==donor.skeleton&&n.skeleton.bones.every(b=>!p.skeleton.bones.includes(b)&&!donor.skeleton.bones.includes(b)),visible:n.visible}})
  const {createAcceptedMotion}=await import('/src/three/clinic/acceptedMotion.ts');const holder=people.clone(false);holder.children=[people];const motion=createAcceptedMotion(holder)
  const floor=root.getWorldPosition(root.position.clone()).y,poses=[]
  for(const p of [0,.32,.625,.725,1]){
   motion.update(p);s.scene.updateMatrixWorld(true)
   let visitorRoot;visitor.traverse(n=>{if(n.isBone&&(n.userData.name??n.name)==='root')visitorRoot=n})
   const agents=[['Reception_Staff',-3.2,2.66,3.32,.3965],['Review_Physician',3.22,-4.54,-3.85,.4075],['Follow_Coordinator',-4.3,-4.5,-3.75,.3965]].map(([id,x,z,chairZ,seat])=>{
    const a=s.scene.getObjectByName(id),hands=['L','R'].map(side=>{const mesh=a.getObjectByName(`${id}__robot__wrist.${side}`);const v=mesh.getWorldPosition(mesh.position.clone());return{side,world:v.toArray(),keyboardXError:Math.abs(v.x-x*.1),keyboardZError:Math.abs(v.z-z*.1),keySurfaceHeight:v.y-floor-.0815}})
    const pelvis=a.getObjectByName(`${id}__robot__root`);pelvis.geometry.computeBoundingBox();const v=pelvis.geometry.boundingBox.clone().applyMatrix4(pelvis.matrixWorld).min,center=pelvis.geometry.boundingBox.getCenter(pelvis.position.clone()).applyMatrix4(pelvis.matrixWorld)
    return{id,hands,pelvisCenter:center.toArray(),seatXZError:Math.hypot(center.x-(id==='Review_Physician'?3.25:x)*.1,center.z-chairZ*.1),seatHeightGap:v.y-floor-seat*.1}
   })
   poses.push({p,visitorRoot:visitorRoot.getWorldPosition(visitorRoot.position.clone()).toArray(),agents})
  }
  return{identity,poses,retiredMaleVisible:s.scene.getObjectByName('Retired_male_visitor').visible}
 })
 fs.writeFileSync('docs/evidence/robot-agents/cast-and-seating.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
 assert.equal(report.identity.length,6)
 assert(report.identity.every(p=>p.sameActualMaterial&&p.matchingVertexCount&&p.maxPositionDelta<.0001&&p.independentSkeleton&&p.visible),'same actual female geometry/material identity, independent rig')
 assert(!report.retiredMaleVisible)
 for(const pose of report.poses){assert(Math.abs(pose.visitorRoot[0]+.48)<.02&&Math.abs(pose.visitorRoot[2]-.414)<.02,'female remains at visitor seat');for(const a of pose.agents){assert(a.seatXZError<.02&&Math.abs(a.seatHeightGap)<.012,'robot pelvis at chair seat');assert(a.hands.every(h=>h.keyboardXError<.02&&h.keyboardZError<.01&&Math.abs(h.keySurfaceHeight)<.006),'hands at authored keyboard')}}
}finally{await browser.close()}
