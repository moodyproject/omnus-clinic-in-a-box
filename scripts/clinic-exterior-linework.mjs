import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const out = 'docs/evidence/exterior-linework'
fs.mkdirSync(out, { recursive: true })
try {
  const page = await browser.newPage()
  await page.setViewport({width:1440,height:900})
  await page.goto('http://127.0.0.1:4198/?pose=0', { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__omnus?.scene)
  const result = await page.evaluate(() => {
    const scene = window.__omnus.scene, rows = []
    scene.traverse(n => {
      if (!n.name.startsWith('exterior-')) return
      if (n.isMesh) {
        const g = n.geometry
        g.computeBoundingBox()
        let obliqueNormals = 0
        const normal = g.attributes.normal
        for (let i=0;i<normal.count;i++) if ([normal.getX(i),normal.getY(i),normal.getZ(i)].filter(v=>Math.abs(v)>0.01).length>1) obliqueNormals++
        rows.push({ name:n.name, type:g.type, obliqueNormals, count:n.count??1, bounds:{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()} })
      }
    })
    return rows
  })
  fs.writeFileSync(`${out}/${process.argv[2]||'after'}.json`,JSON.stringify(result,null,2))
  assert.equal(result.filter(r=>r.name==='exterior-seam').length,2,'two consistently machined fascia/chassis seams')
  assert.equal(result.filter(r=>r.name==='exterior-vent-fins').length,3,'three matching side/rear ventilation bands')
  assert.equal(result.filter(r=>r.name==='exterior-top-slot').length,1)
  assert.ok(result.every(r=>r.obliqueNormals>0),'all exterior detail geometry needs rounded edges, not sharp boxes')
  assert.ok(result.filter(r=>r.name==='exterior-vent-fins').every(r=>r.count===30))
  console.log(JSON.stringify(result))
  await page.screenshot({path:`${out}/desktop.png`})
  await page.setViewport({width:390,height:844,isMobile:true})
  await page.reload({waitUntil:'networkidle0'})
  await page.waitForFunction(()=>window.__omnus?.scene)
  await page.screenshot({path:`${out}/mobile.png`})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  assert.equal(await page.$('.scene-error'),null)
}finally{await browser.close()}
