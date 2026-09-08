import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const base=process.argv[2]||'http://127.0.0.1:4180/omnus-clinic-in-a-box/'
const out=process.argv[3]||'docs/evidence/clinic-site-integration/journey'
fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--force-color-profile=srgb']})
const results=[];const errors=[]
const wait=ms=>new Promise(r=>setTimeout(r,ms))
const check=(name,pass,detail)=>{results.push({name,pass,detail});console.log(pass?'PASS':'FAIL',name,JSON.stringify(detail??''))}
const state=page=>page.evaluate(()=>({y:scrollY,total:document.querySelector('.journey')?.offsetHeight-innerHeight,scene:[...document.querySelectorAll('.copy-block')].filter(e=>Number(getComputedStyle(e).opacity)>.8).map(e=>e.dataset.scene),overflow:document.documentElement.scrollWidth>innerWidth,canvas:!!document.querySelector('canvas')}))
const scroll=async(page,p)=>{await page.evaluate(p=>{const el=document.querySelector('.journey');scrollTo(0,el.offsetTop+(el.offsetHeight-innerHeight)*p)},p);await wait(1800);return state(page)}
try{
 for(const [width,height] of [[1440,900],[390,844],[375,667]]){
  const page=await browser.newPage();await page.setViewport({width,height,deviceScaleFactor:width<900?2:1,isMobile:width<900,hasTouch:width<900})
  page.on('pageerror',e=>errors.push(String(e)))
  const failed=[],glbs=[];page.on('requestfailed',r=>failed.push(r.url()));page.on('response',r=>{if(r.url().endsWith('.glb'))glbs.push({url:r.url(),status:r.status()})})
  await page.setRequestInterception(true);page.on('request',r=>r.method()==='POST'?r.abort():r.continue())
  await page.goto(base,{waitUntil:'networkidle0'});await wait(1000)
  check(`${width} assets`,glbs.length===5&&glbs.every(r=>[200,304].includes(r.status)&&r.url.startsWith(base+'models/')),glbs)
  const samples=[]
  for(const [name,p,expected] of [['hero',0,'object'],['opening',.165,'enter'],['reception',.32,'before'],['exam',.47,'during'],['review',.59,'review'],['follow',.69,'after'],['overhead',.82,'ops'],['closing',.93,null],['final',1,'reveal']]){
   const sample=await scroll(page,p);samples.push({name,p,...sample})
   check(`${width} native ${name}`,sample.canvas&&!sample.overflow&&(!expected||sample.scene.includes(expected)),sample)
   await page.screenshot({path:`${out}/${width}-${name}.png`})
  }
  for(const p of [.82,.69,.59,.47,.32,0])await scroll(page,p)
  const forward=await scroll(page,.47);await scroll(page,.85);const reverse=await scroll(page,.47)
  check(`${width} forward reverse`,Math.abs(forward.y-reverse.y)<2&&reverse.scene.includes('during'),{forward,reverse})
  await page.reload({waitUntil:'networkidle0'});await wait(2200);const reload=await state(page)
  check(`${width} native reload`,Math.abs(reload.y-reverse.y)<4&&reload.scene.includes('during'),{before:reverse,after:reload})
  await page.goto(base+'?static=1',{waitUntil:'networkidle0'});await page.goBack({waitUntil:'networkidle0'});await wait(2200);const back=await state(page)
  check(`${width} history back`,Math.abs(back.y-reverse.y)<4&&back.scene.includes('during'),{before:reverse,after:back})
  await page.click('.nav-cta');await wait(150)
  check(`${width} demo focus`,await page.evaluate(()=>document.querySelector('[role="dialog"]')?.contains(document.activeElement)))
  for(let n=0;n<14;n++)await page.keyboard.press('Tab')
  check(`${width} modal trap`,await page.evaluate(()=>document.querySelector('[role="dialog"]')?.contains(document.activeElement)))
  await page.click('[role="dialog"] button[type="submit"]');await wait(150)
  check(`${width} empty validation`,!!await page.$('.field-error'))
  await page.keyboard.press('Escape');check(`${width} escape`,!await page.$('[role="dialog"]'))
  await scroll(page,0);await page.click('[data-scene="object"] .btn-secondary');await wait(150)
  check(`${width} waitlist`,!!await page.$('[role="dialog"]'))
  await page.screenshot({path:`${out}/${width}-waitlist.png`});await page.click('.modal-close')
  await page.click('.skip-tour');await wait(300);check(`${width} skip`,await page.$eval('#contact',e=>e.getBoundingClientRect().top<innerHeight))
  await page.click('.wordmark');await page.waitForFunction(()=>scrollY<2,{timeout:5000});check(`${width} back to top`,(await state(page)).y<2)
  if(width===1440){
   for(const [text,expected] of [['product','during'],['vision','ops']]){
    await page.evaluate(text=>[...document.querySelectorAll('.nav-link')].find(e=>e.textContent===text).click(),text);await wait(2200)
    const navigation=await state(page)
    // Vision intentionally retains the live site's .8 navigation point;
    // its copy fades here in both versions (verified by final.mjs).
    check(`nav ${text}`,Math.abs(navigation.y/navigation.total-(text==='vision'?.8:.44))<.002&&(text==='vision'||navigation.scene.includes(expected)),navigation)
   }
  }
  await page.setViewport({width:width===1440?800:width+40,height,deviceScaleFactor:1});await wait(2000)
  check(`${width} resize`,(await state(page)).canvas&&!(await state(page)).overflow,await state(page))
  check(`${width} network failures`,failed.length===0,failed)
  await page.close()
 }
 check('no page exceptions',errors.length===0,errors)
}finally{fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close()}
assert.ok(results.every(r=>r.pass),'journey regression failures; see results.json')
