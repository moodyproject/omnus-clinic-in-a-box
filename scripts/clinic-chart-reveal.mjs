import fs from 'node:fs'
import assert from 'node:assert/strict'
import puppeteer from 'puppeteer-core'
const out='docs/evidence/natural-motion/reveal';fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),results=[]
try{for(const width of [390,1440]){
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)))
 await page.setViewport({width,height:width===390?844:900});await page.goto('http://127.0.0.1:4202/?p=.704',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('physician-clinical-chart')&&window.__omnus.get().internal.frames===0)
 const rows=await page.evaluate(async()=>{
  const s=window.__omnus,chart=s.scene.getObjectByName('physician-clinical-chart'),e=document.querySelector('.journey'),rows=[],start=performance.now()
  await new Promise(resolve=>{function tick(now){const t=Math.min(1,(now-start)/6000),p=.704+.09*t;scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*p);rows.push({ms:now-start,input:p,alpha:chart.visible?chart.children[0].material.opacity:0});if(t<1)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)})
  await new Promise(r=>setTimeout(r,1500));rows.push({ms:performance.now()-start,input:.794,alpha:chart.visible?chart.children[0].material.opacity:0});return rows
 })
 const report={width,frames:rows.length,partialFrames:rows.filter(r=>r.alpha>.02&&r.alpha<.98).length,maxAlphaStep:Math.max(...rows.slice(1).map((r,i)=>Math.abs(r.alpha-rows[i].alpha))),startAlpha:rows[0].alpha,endAlpha:rows.at(-1).alpha,errors}
 results.push(report);fs.writeFileSync(`${out}/${width}-playback.json`,JSON.stringify(rows,null,2));fs.writeFileSync(`${out}/summary.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(report))
 assert(report.partialFrames>2,'chart should ease in/out, not pop');assert.equal(report.startAlpha,0);assert.equal(report.endAlpha,0);assert(report.maxAlphaStep<.5);assert.deepEqual(errors,[]);await page.close()
}}finally{await browser.close()}
