import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const out = 'docs/evidence/exterior-linework'
fs.mkdirSync(out, { recursive: true })
try {
  const page = await browser.newPage()
  await page.setViewport({width:1440,height:900})
  await page.goto(`${process.env.BASE_URL||'http://127.0.0.1:4202/'}?pose=0`, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__omnus?.scene)
  const result = await page.evaluate(() => {
    const scene = window.__omnus.scene, rows = []
    scene.traverse(n => {
      if (!n.name.startsWith('exterior-') && !['reference-housing','reference-front-panel','reference-panel-seam','reference-slot-grille'].includes(n.name)) return
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
  assert.equal(result.filter(r=>r.name==='reference-panel-seam').length,1,'reference perimeter seam')
  assert.equal(result.filter(r=>r.name==='reference-slot-grille').length,2,'matching horizontal side grilles')
  assert.equal(result.filter(r=>r.name==='exterior-top-slot').length,0,'reference top stays unbroken')
  assert.ok(result.filter(r=>r.name.startsWith('exterior-')).every(r=>r.obliqueNormals>0),'retained rear ports have machined edges')
  assert.ok(result.filter(r=>r.name==='reference-slot-grille').every(r=>r.count===70))
  assert.ok(result.some(r=>r.name==='reference-housing'&&r.type==='ExtrudeGeometry'&&r.obliqueNormals>0),'clipped, beveled housing')
  console.log(JSON.stringify(result))
  await page.screenshot({path:`${out}/desktop.png`})
  await page.setViewport({width:390,height:844,isMobile:true})
  await page.reload({waitUntil:'networkidle0'})
  await page.waitForFunction(()=>window.__omnus?.scene)
  await page.screenshot({path:`${out}/mobile.png`})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  assert.equal(await page.$('.scene-error'),null)
}finally{await browser.close()}
