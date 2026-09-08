import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'
const base=process.argv[2]||'http://127.0.0.1:4190/omnus-clinic-in-a-box/'
const out=process.argv[3]||'docs/evidence/clinic-motion/overhead-green';fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
const results=[]
try{
 for(const width of [390,375,1440]){
  const height=width===1440?900:844,page=await browser.newPage();await page.setViewport({width,height,deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500})
  await page.goto(base,{waitUntil:'networkidle0'})
  // Desktop sanity is the overhead scene itself. Its existing .87 reveal
  // crosses the sleeve and is explicitly outside this mobile-only repair.
  const progress=width===1440?[.82]:[.82,.79,.85,.87,.85,.82]
  for(const [i,p] of progress.entries()){
   await page.evaluate(p=>{const e=document.querySelector('.journey');scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*p)},p)
   await new Promise(r=>setTimeout(r,2000))
   const bytes=await page.screenshot({path:`${out}/${width}-${i}-${p}.png`})
   const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true})
   let clinicPixels=0
   // Inspect actual canvas pixels, excluding navigation and bottom copy. The
   // occluding gray panel has no chroma; visible oak/sage/clothing do.
   for(let y=100;y<height*.64;y++)for(let x=10;x<width-10;x++){
    const k=(y*info.width+x)*info.channels;const rgb=[data[k],data[k+1],data[k+2]]
    if(Math.max(...rgb)-Math.min(...rgb)>22)clinicPixels++
   }
   const row={width,p,clinicPixels};results.push(row);console.log(row)
   assert.ok(clinicPixels>1000,`actual clinic hidden behind gray panel at ${width}/${p}`)
  }
  await page.close()
 }
}finally{fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close()}
