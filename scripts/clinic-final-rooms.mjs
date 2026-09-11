import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const out='docs/evidence/doctor-journey/final-rooms';fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try {
 const page=await browser.newPage();await page.setViewport({width:1440,height:900});await page.goto('http://127.0.0.1:4202/',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('physician-seated'))
 const result=await page.evaluate(async()=>{
  const s=window.__omnus;s.setFrameloop('never');const root=s.scene.getObjectByName('accepted-clinic');const {createAcceptedMotion}=await import('/src/three/clinic/acceptedMotion.ts');const motion=createAcceptedMotion(root);const actor=root.getObjectByName('physician-seated');let bone;actor.traverse(n=>{if(n.isBone&&(n.userData.name??n.name)==='root')bone=n});
  const sample=p=>{motion.update(p);s.scene.updateMatrixWorld(true);return {p,root:bone.getWorldPosition(bone.position.clone()).toArray()}};
  const samples=[.525,.545,.565,.585,.605,.625,.645,.665,.685,.705,.735,.76].map(sample);const ref=sample(.645);let repeatError=0;for(const p of [1,0,.645,.76,.645,.645]){const r=sample(p);if(p===.645)r.root.forEach((v,i)=>repeatError=Math.max(repeatError,Math.abs(v-ref.root[i])))}motion.dispose();return {samples,repeatError}
 });
 fs.writeFileSync(`${out}/${process.argv.includes('--baseline')?'baseline-failure':'journey'}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));const review=result.samples.find(s=>s.p===.645).root,follow=result.samples.find(s=>s.p===.76).root;assert.ok(review[0]>.15&&review[2]<-.35,'same doctor must enter review room');assert.ok(Math.hypot(follow[0]+.3,follow[2]+.3225)<.04,'doctor must reach the open handoff area beside the coordinator');assert.ok(result.repeatError<1e-8)
}finally{await browser.close()}
