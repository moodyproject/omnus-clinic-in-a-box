import fs from 'node:fs'
import assert from 'node:assert/strict'
import sharp from 'sharp'
const root='docs/evidence/mobile-framing-motion'
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'))
const before=read(`${root}/live-before/results.json`), framing=read(`${root}/matrix-green/results.json`)
assert.equal(before.length,6);assert.equal(framing.length,8)
assert.equal(new Set(framing.map(r=>`${r.engine}-${r.width}`)).size,8)
assert.ok(framing.every(r=>!r.errors.length&&r.checks.length===7))
const cases=['native-final390','native-webkit375-optin','native-webkit430-retry']
const motion=cases.map(name=>({name,actors:read(`${root}/${name}/results.json`)}))
for(const c of motion){assert.equal(c.actors.length,6);assert.equal(new Set(c.actors.map(a=>a.id)).size,6);assert.ok(c.actors.every(a=>a.displacement>=12&&a.changedPixels>=200));assert.equal(c.actors.filter(a=>a.native).length,5)}
const recovery=read('docs/evidence/mobile-recovery/framing-final/results.json');assert.equal(recovery.length,6);assert.ok(recovery.every(r=>r.pass))
const production=read(`${root}/production-journey/results.json`);assert.equal(production.length,69);assert.ok(production.every(r=>r.pass))
const finalProduction=read(`${root}/final-production/results.json`);assert.equal(finalProduction.length,1);assert.deepEqual(finalProduction[0].errors,[])
const native=read('docs/evidence/clinic-motion/native/results.json');assert.equal(native.length,3);assert.ok(native.every(r=>r.reverseBoneError<.0001&&r.reloadBoneError<.0001))
const contacts=read('docs/evidence/clinic-motion/validation/determinism-contacts.json');assert.equal(contacts.holdError,0);assert.equal(contacts.freshError,0);assert.equal(contacts.reverseErrors.length,0)
const summary={beforePhoneCases:before.length,framingCases:framing.length,framingChecks:framing.reduce((n,r)=>n+r.checks.length,0),motionCases:motion.length,actorPairs:motion.reduce((n,c)=>n+c.actors.length,0),minSeatedPixelDisplacement:Math.min(...motion.flatMap(c=>c.actors.filter(a=>a.id!=='patient-seated').map(a=>a.displacement))),minSeatedChangedPixels:Math.min(...motion.flatMap(c=>c.actors.filter(a=>a.id!=='patient-seated').map(a=>a.changedPixels))),recoveryCases:recovery.length,nativeRegressionCases:native.length,contacts:{hold:contacts.holdError,fresh:contacts.freshError,reverseErrors:contacts.reverseErrors.length},limit:'macOS browser mobile/touch emulation, not physical iOS; patient pair is locked-camera clip seek, seated pairs ordinary scrolling; visual review is separate from numeric gates'}
fs.writeFileSync(`${root}/summary.json`,JSON.stringify(summary,null,2))
const label=(text,w)=>Buffer.from(`<svg width="${w}" height="32"><rect width="100%" height="100%" fill="white"/><text x="12" y="22" font-size="16">${text}</text></svg>`)
const scenes=['reception','consult-b','review','follow','overview']
const images=[]
for(const [i,scene]of scenes.entries())for(const [j,dir]of ['live-before','matrix-green'].entries()){
 const input=await sharp(`${root}/${dir}/chromium-390-${scene}.png`).extend({top:32,bottom:0,left:0,right:0,background:'white'}).composite([{input:label(`${j?'AFTER':'BEFORE'} · ${scene} ·390px`,390),top:0,left:0}]).png().toBuffer();images.push({input,left:j*390,top:i*876})
}
await sharp({create:{width:780,height:scenes.length*876,channels:3,background:'white'}}).composite(images).png().toFile(`${root}/before-after-phone.png`)
await sharp({create:{width:780,height:876,channels:3,background:'white'}}).composite(images.slice(-2).map(image=>({...image,top:0}))).png().toFile(`${root}/before-after-overview.png`)
const pairInputs=[];let height=0
for(const [i,path]of [`${root}/motion-red/chromium-390-actors.png`,`${root}/native-final390/chromium-390-actors.png`].entries()){
 const m=await sharp(path).metadata();height=Math.max(height,m.height+32);const input=await sharp(path).extend({top:32,bottom:0,left:0,right:0,background:'white'}).composite([{input:label(i?'AFTER · 5 native / patient fixed':'BEFORE · locked camera',400),top:0,left:0}]).png().toBuffer();pairInputs.push({input,left:i*400,top:0})
}
await sharp({create:{width:800,height,channels:3,background:'white'}}).composite(pairInputs).png().toFile(`${root}/before-after-six-actors.png`)
console.log(JSON.stringify(summary,null,2))
