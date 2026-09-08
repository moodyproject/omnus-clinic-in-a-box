import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base=process.argv[2]||'http://127.0.0.1:4190/'
const out=process.argv[3]||'docs/evidence/clinic-motion/film'
fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--force-color-profile=srgb']})
try{
 for(const [view,width,height,a,b,count] of [['desktop',1440,900,.19,.80,92],['mobile390',390,844,.19,.80,92],['contact-side',1100,800,.385,.445,40],['contact-front',1100,800,.40,.44,20]]){
  if(process.argv.includes('--front-only')&&view!=='contact-front')continue
  const page=await browser.newPage();await page.setViewport({width,height,deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500})
  await page.goto(base+'?pose=.82',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('room-people'))
  await page.addStyleTag({content:'.copy-layer,.nav,.skip-tour{visibility:hidden!important}'})
  await page.evaluate(async(view)=>{
   const s=window.__omnus;s.setFrameloop('never')
   s.camera.up.set(0,1,0)
   const {createAcceptedMotion}=await import('/src/three/clinic/acceptedMotion.ts');window.motionProof=createAcceptedMotion(s.scene.getObjectByName('accepted-clinic'))
   if(view==='contact-side'){s.camera.position.set(.90,.43,.37);s.camera.lookAt(.265,.225,.38);s.camera.fov=35;s.camera.updateProjectionMatrix()}
   else if(view==='contact-front'){s.camera.position.set(-.10,.38,.15);s.camera.lookAt(.265,.21,.40);s.camera.fov=35;s.camera.updateProjectionMatrix()}
   else {s.camera.position.set(...(view==='desktop'?[1.1,1.35,1.6]:[2.5,3,3.5]));s.camera.lookAt(0,.18,0);s.camera.fov=35;s.camera.updateProjectionMatrix()}
   s.camera.updateMatrixWorld(true)
   const {loadAcceptedModel,createWallCutaway}=await import('/src/three/clinic/acceptedModel.ts')
   const current=s.scene.getObjectByName('accepted-clinic')
   const baseline=await loadAcceptedModel('/assets/clinic-motion/local/baseline/',()=>false)
   baseline.position.copy(current.position);s.scene.add(baseline);createWallCutaway(baseline)(1)
   current.visible=false;s.gl.render(s.scene,s.camera)
   window.motionBaseline=baseline
  },view)
  await page.screenshot({path:`${out}/before-${view}.png`})
  await page.evaluate(()=>{const s=window.__omnus;const old=window.motionBaseline;s.scene.remove(old);s.scene.getObjectByName('accepted-clinic').visible=true})
  fs.mkdirSync(`${out}/${view}`,{recursive:true})
  for(let i=0;i<count;i++){
   const p=a+(b-a)*i/(count-1)
   await page.evaluate(p=>{const s=window.__omnus;window.motionProof.update(p);s.scene.updateMatrixWorld(true);s.gl.render(s.scene,s.camera)},p)
   await page.screenshot({path:`${out}/${view}/${String(i).padStart(3,'0')}.png`})
  }
  await page.close();console.log('CAPTURED',view,count)
 }
}finally{await browser.close()}
