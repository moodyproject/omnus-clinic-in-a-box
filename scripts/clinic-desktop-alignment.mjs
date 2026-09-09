import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
const out='docs/evidence/desktop-alignment';fs.mkdirSync(out,{recursive:true})
const base=process.env.BASE_URL||'http://127.0.0.1:4198/'
const rows=[],failures=[]
try {
 for(const [width,height] of [[1093,1012],[1024,768],[1280,900],[1440,900],[1680,1050]]) {
  const page=await browser.newPage();await page.setViewport({width,height})
  await page.evaluateOnNewDocument(()=>{window.__qaRoots=new Set();window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,inject:()=>1,onCommitFiberRoot:(_id,root)=>window.__qaRoots.add(root),onCommitFiberUnmount:()=>{},onPostCommitFiberRoot:()=>{}}})
  await page.goto(base,{waitUntil:'networkidle0'})
  await page.waitForFunction(()=>{
   if(window.__omnus?.scene.getObjectByName('room-people'))return true
   for(const root of window.__qaRoots){const stack=[root.current],seen=new Set();while(stack.length){const f=stack.pop();if(!f||seen.has(f))continue;seen.add(f);const store=f.memoizedProps?.value;if(store?.getState){const s=store.getState();if(s.scene?.getObjectByName('room-people')){window.__omnus=s;return true}}stack.push(f.child,f.sibling)}}return false
  })
  await new Promise(resolve=>setTimeout(resolve,700))
  const row=await page.evaluate(()=>{
   const s=window.__omnus;s.camera.updateMatrixWorld(true)
   const corners=[-.68,.68].flatMap(x=>[0,.942].flatMap(y=>[-.68,.68].map(z=>{const v=s.camera.position.clone().set(x,y,z).project(s.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2}})))
   const block=document.querySelector('[data-scene="object"]'),inner=block.querySelector('.copy-inner')
   return{width:innerWidth,height:innerHeight,copy:inner.getBoundingClientRect().toJSON(),block:block.getBoundingClientRect().toJSON(),corners,cueTracks:document.querySelectorAll('.cue-track').length,cueText:document.querySelector('.scroll-cue')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,camera:s.camera.position.toArray(),fov:s.camera.fov}
  })
  const left=Math.min(...row.corners.map(p=>p.x)),right=Math.max(...row.corners.map(p=>p.x))
  rows.push({...row,productLeft:left,productRight:right,gap:left-row.copy.right})
  if(row.cueTracks)failures.push(`${width}: cue line remains`)
  if(width/height<1.6 && left<row.copy.right+20)failures.push(`${width}: copy/device overlap, gap=${left-row.copy.right}`)
  if(row.overflow)failures.push(`${width}: horizontal overflow`)
  if(row.cueText.trim()!=='scroll to open')failures.push(`${width}: cue wording changed`)
  if(width===1680) {
   await page.setViewport({width:1093,height:1012})
   await new Promise(resolve=>setTimeout(resolve,2200))
   const resized=await page.evaluate(()=>{
    const s=window.__omnus;s.camera.updateMatrixWorld(true)
    const xs=[-.68,.68].flatMap(x=>[0,.942].flatMap(y=>[-.68,.68].map(z=>{const v=s.camera.position.clone().set(x,y,z).project(s.camera);return(v.x+1)*innerWidth/2})))
    return{width:innerWidth,gap:Math.min(...xs)-document.querySelector('[data-scene="object"] .copy-inner').getBoundingClientRect().right,right:Math.max(...xs)}
   })
   rows.at(-1).resized=resized
   if(resized.gap<20||resized.right>resized.width-20)failures.push('live desktop resize must preserve text/device gap and right margin')
  }
  await page.close()
 }
 fs.writeFileSync(`${out}/${process.argv[2]||'after'}.json`,JSON.stringify(rows,null,2))
 console.log(JSON.stringify(rows.map(({width,height,copy,block,productLeft,productRight,gap,camera,fov})=>({width,height,copyRight:copy.right,blockRight:block.right,productLeft,productRight,gap,camera,fov})),null,2))
 assert.deepEqual(failures,[])
}finally{await browser.close()}
