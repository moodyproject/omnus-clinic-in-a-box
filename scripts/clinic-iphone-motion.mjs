import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRequire} from 'node:module'
const {webkit}=createRequire('/Users/moud/.hermes/hermes-agent/package.json')('playwright')
const browser=await webkit.launch({headless:true})
const out='docs/evidence/iphone-safari';fs.mkdirSync(out,{recursive:true})
try {
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,reducedMotion:'reduce'})
 await page.goto('http://127.0.0.1:4198/',{waitUntil:'networkidle'})
 await page.waitForFunction(()=>window.__omnus?.scene.getObjectByName('room-people'))
 const button=page.locator('[data-action="toggle-motion"]')
 assert.equal(await button.count(),1,'reduced-motion phone needs an explicit full-motion control')
 const sample=async p=>{await page.evaluate(p=>{const e=document.querySelector('.journey');scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*p)},p);await page.waitForTimeout(1400);return page.evaluate(()=>{const a=[];window.__omnus.scene.getObjectByName('accepted-clinic').traverse(n=>{if(n.isBone)a.push(...n.quaternion.toArray())});return a})}
 const error=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])))
 const held=error(await sample(.3),await sample(.34));assert.equal(held,0)
 await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true')
 const moving=error(await sample(.3),await sample(.34));assert.ok(moving>.05,'explicit full motion must animate actual character bones')
 assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true,'do not change or lie about system preference')
 await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false')
 const heldAgain=error(await sample(.3),await sample(.34));assert.equal(heldAgain,0)
 const desktop=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'})
 await desktop.goto('http://127.0.0.1:4198/',{waitUntil:'networkidle'})
 assert.equal(await desktop.locator('[data-action="toggle-motion"]').count(),0,'desktop controls unchanged')
 const result={held,moving,heldAgain,systemPreferencePreserved:true,desktopControlAbsent:true}
 fs.writeFileSync(`${out}/motion-control.json`,JSON.stringify(result,null,2));console.log(result)
}finally{await browser.close()}
