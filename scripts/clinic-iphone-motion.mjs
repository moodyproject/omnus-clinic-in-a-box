import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRequire} from 'node:module'
const {webkit}=createRequire('/Users/moud/.hermes/hermes-agent/package.json')('playwright')
const browser=await webkit.launch({headless:true})
const out='docs/evidence/iphone-safari';fs.mkdirSync(out,{recursive:true})
const base=process.env.BASE_URL||'http://127.0.0.1:4198/'
const rows=[]
try {
 for(const width of [390,1440]) for(const reducedMotion of ['reduce','no-preference']) {
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390,deviceScaleFactor:width===390?3:1,reducedMotion})
  const errors=[];page.on('pageerror',e=>errors.push(String(e)))
  await page.addInitScript(()=>{window.__qaRoots=new Set();const renderers=new Map();window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,renderers,inject:renderer=>{const id=renderers.size+1;renderers.set(id,renderer);return id},onCommitFiberRoot:(_id,root)=>window.__qaRoots.add(root),onCommitFiberUnmount:()=>{},onPostCommitFiberRoot:()=>{}}})
  await page.goto(base,{waitUntil:'networkidle'})
  await page.waitForFunction(()=>{
   if(window.__omnus?.scene.getObjectByName('room-people')){window.__scene=window.__omnus;return true}
   for(const root of window.__qaRoots){const stack=[root.current],seen=new Set();while(stack.length){const f=stack.pop();if(!f||seen.has(f))continue;seen.add(f);const store=f.memoizedProps?.value;if(store?.getState){const s=store.getState();if(s.scene?.getObjectByName('room-people')){window.__scene=s;return true}}stack.push(f.child,f.sibling)}}return false
  })
  assert.equal(await page.locator('[data-action="toggle-motion"],.motion-preference,[data-action="enable-3d"]').count(),0,'no visitor motion switch')
  const sample=async p=>{await page.evaluate(p=>{const e=document.querySelector('.journey');scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*p)},p);await page.waitForTimeout(1400);return page.evaluate(()=>{const a=[];window.__scene.scene.getObjectByName('accepted-clinic').traverse(n=>{if(n.isBone)a.push(...n.quaternion.toArray())});return a})}
  const a=await sample(.3),b=await sample(.34)
  const motion=Math.max(...a.map((v,i)=>Math.abs(v-b[i])))
  assert.ok(motion>.05,'full motion must run automatically, including under OS reduced motion')
  assert.deepEqual(errors,[])
  rows.push({width,reducedMotion,motion,controls:0,errors})
  fs.writeFileSync(`${out}/${process.argv[2]||'always-on'}.json`,JSON.stringify({base,rows},null,2))
  await page.close()
 }
 console.log(JSON.stringify(rows))
}finally{await browser.close()}
