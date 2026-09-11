import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const out='docs/evidence/room-story';fs.mkdirSync(out,{recursive:true})
const base=process.env.BASE_URL||'http://127.0.0.1:4202/'
const stages=[['enter',.19,'one physician. a team of ai agents.'],['before',.32,'triage & intake'],['during',.48,'real-time ai'],['review',.625,'physician sign-off'],['after',.725,'approved. then follow-through.'],['ops',.82,'one connected clinic.']]
const rows=[],browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try {
 for(const width of [1440,390]) {
  const page=await browser.newPage();await page.setViewport({width,height:width===390?844:900})
  for(const [id,p,heading] of stages) {
   await page.goto(`${base}?pose=${p}`,{waitUntil:'networkidle0'})
   await page.evaluate(()=>document.fonts.ready)
   const row=await page.evaluate(id=>{
    const block=document.querySelector(`.copy-block[data-scene="${id}"]`),inner=block.querySelector('.copy-inner'),r=inner.getBoundingClientRect(),style=getComputedStyle(block)
    return {id,heading:block.querySelector('.copy-heading').textContent,body:block.querySelector('.copy-body').textContent,side:block.dataset.side,opacity:Number(style.opacity),visibility:style.visibility,bounds:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}
   },id)
   rows.push(row);fs.writeFileSync(`${out}/rendered-copy.json`,JSON.stringify(rows,null,2))
   assert.equal(row.heading,heading);assert.equal(row.side,'left');assert(row.opacity>.95&&row.visibility==='visible',`${id}: active room copy`)
   assert(row.bounds.left>=-1&&row.bounds.right<=width+1&&row.bounds.top>=-1&&row.bounds.bottom<=row.height+1,`${id}: copy fits ${width}px viewport`)
   assert(!row.overflow,`${id}: no horizontal overflow`)
  }
  await page.close()
 }
} finally {await browser.close()}
assert.equal(new Set(rows.map(r=>`${r.width}:${r.id}`)).size,12)
console.log('PASS: all six revised panels visible and within desktop/phone-width viewports')
