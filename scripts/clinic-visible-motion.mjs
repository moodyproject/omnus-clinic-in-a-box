import assert from 'node:assert/strict'
import fs from 'node:fs'
import sharp from 'sharp'
import {createRequire} from 'node:module'
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE||'/Users/moud/.hermes/hermes-agent/package.json')
const {chromium,webkit}=require('playwright')
const out=process.env.OUT||'docs/evidence/mobile-framing-motion/motion-red'
const engine=process.env.ENGINE||'chromium', width=Number(process.env.WIDTH||390)
fs.mkdirSync(out,{recursive:true})
const browser=await ({chromium,webkit}[engine]).launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})})
const rows=[], sheets=[]
try {
 const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:process.env.MODE==='reduced'?'reduce':'no-preference'})
 if(process.env.MODE==='retry') await page.route('**/patient-seated.glb',r=>r.abort())
 await page.goto('http://127.0.0.1:4198/',{waitUntil:'networkidle'})
 if(process.env.MODE==='reduced') await page.locator('[data-action="enable-3d"]').click()
 if(process.env.MODE==='retry'){await page.locator('[data-action="retry-3d"]').waitFor();await page.unroute('**/patient-seated.glb');await page.locator('[data-action="retry-3d"]').click()}
 await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('room-people'))
 await page.evaluate(async()=>{window.journey=await import('/src/scroll/journey.ts')})
 for(const [id,stage,a,b] of [['Reception_Staff',.30,.281,.315],['Reception_Visitor',.30,.305,.344],['physician-seated',.47,.439,.478],['patient-seated',.47,.387,.43],['Review_Physician',.60,.571,.606],['Follow_Coordinator',.71,.675,.711]]){
  await page.evaluate(p=>{const s=window.__omnus;s.setFrameloop('always');const e=document.querySelector('.journey');scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*p)},stage)
  await page.waitForFunction(p=>Math.abs(window.journey.smoothedState.p-p)<.0005,stage);await page.waitForTimeout(1300)
  const native = process.env.NATIVE === '1' && id !== 'patient-seated'
  if (!native) await page.evaluate(async()=>{const s=window.__omnus;s.setFrameloop('never');const {createAcceptedMotion}=await import('/src/three/clinic/acceptedMotion.ts');window.pairMotion=createAcceptedMotion(s.scene.getObjectByName('accepted-clinic'))})
  const frames=[]
  for(const p of [a,b]){
   if (native) {
    await page.evaluate(p=>{const e=document.querySelector('.journey');scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*p)},p)
    await page.waitForFunction(p=>Math.abs(window.journey.journeyState.p-p)<.0005&&Math.abs(window.journey.smoothedState.p-window.journey.journeyState.p)<1e-9,p)
    await page.waitForTimeout(800)
   }
   const points=await page.evaluate(({p,id,native})=>{const s=window.__omnus;if(!native)window.pairMotion.update(p);s.scene.updateMatrixWorld(true);s.gl.render(s.scene,s.camera);const n=s.scene.getObjectByName(id),points=[];n.traverse(m=>{if(!m.isSkinnedMesh)return;m.skeleton.update();for(let i=0;i<m.geometry.attributes.position.count;i+=17){const v=m.position.clone();m.getVertexPosition(i,v);v.applyMatrix4(m.matrixWorld).project(s.camera);points.push([(v.x+1)*innerWidth/2,(1-v.y)*innerHeight/2])}});return points},{p,id,native})
   const path=`${out}/${engine}-${width}-${id}-${p}.png`;await page.screenshot({path});frames.push({points,path})
  }
  const all=frames.flatMap(f=>f.points),minX=Math.max(0,Math.floor(Math.min(...all.map(p=>p[0]))-10)),minY=Math.max(0,Math.floor(Math.min(...all.map(p=>p[1]))-10))
  const crop={left:minX,top:minY,width:Math.min(width-minX,Math.ceil(Math.max(...all.map(p=>p[0]))+10-minX)),height:Math.min(844-minY,Math.ceil(Math.max(...all.map(p=>p[1]))+10-minY))}
  const buffers=await Promise.all(frames.map(f=>sharp(f.path).extract(crop).removeAlpha().raw().toBuffer()))
  let changedPixels=0;for(let i=0;i<buffers[0].length;i+=3)if(Math.max(...[0,1,2].map(k=>Math.abs(buffers[0][i+k]-buffers[1][i+k])))>24)changedPixels++
  const displacement=Math.max(...frames[0].points.map((p,i)=>Math.hypot(p[0]-frames[1].points[i][0],p[1]-frames[1].points[i][1])))
  // Baseline seated surfaces moved only1.5–3.6px. Inspected readable poses
  // move18–39px: require a12px excursion plus200 high-contrast pixels, not
  // a nonzero skeleton epsilon. This supports, never replaces, visual QA.
  const row={id,stage,a,b,native,crop,displacement,changedPixels,pass:displacement>=12&&changedPixels>=200};rows.push(row)
  const images=[];for(let i=0;i<2;i++){const image=await sharp(frames[i].path).extract(crop).png().toBuffer();images.push({input:image,left:20+i*190,top:40})}
  const title=Buffer.from(`<svg width="400" height="35"><rect width="100%" height="100%" fill="white"/>${id==='patient-seated'
    ? `<text x="8" y="15" font-size="14">patient-seated: fixed-camera walk/sit</text><text x="8" y="31" font-size="12">${a} → ${b}, ${width}px viewport</text>`
    : `<text x="8" y="22" font-size="14">${id}: ${a} → ${b}, native ${width}px</text>`}</svg>`)
  const panel=await sharp({create:{width:400,height:Math.max(240,crop.height+50),channels:3,background:'white'}}).composite([{input:title,left:0,top:0},...images]).png().toBuffer();await fs.promises.writeFile(`${out}/${id}-pair.png`,panel);sheets.push(panel)
  // Dispose diagnostics, then normal runtime re-seeks on the next native stage.
  if (!native) await page.evaluate(()=>window.pairMotion.dispose())
 }
 const heights=await Promise.all(sheets.map(b=>sharp(b).metadata().then(m=>m.height))),total=heights.reduce((a,b)=>a+b,0);let top=0
 await sharp({create:{width:400,height:total,channels:3,background:'white'}}).composite(sheets.map((input,i)=>{const image={input,left:0,top};top+=heights[i];return image})).png().toFile(`${out}/${engine}-${width}-actors.png`)
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));assert.equal(rows.length,6);assert.ok(rows.every(r=>r.pass),'every named actor must show >=12 CSS px articulated surface movement and >=200 visibly changed crop pixels; visual inspection remains mandatory')
}finally{await browser.close()}
