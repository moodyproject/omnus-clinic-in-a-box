import assert from 'node:assert/strict'
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'
const root = 'docs/evidence/performance-choreography'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const summaries = []
try {
 const page = await browser.newPage()
 for (const phase of ['baseline', 'after']) {
  const dir = `${root}/${phase}-roles`, rows = JSON.parse(fs.readFileSync(`${dir}/results.json`))
  for (const row of rows) {
   // A compacted baseline retains its strips, full midpoint frames, bone
   // samples and measured pixel counts. Re-capture candidate poses before
   // re-running this script for fresh candidate measurements.
   if (!fs.existsSync(`${dir}/${row.samples[0].file}`)) {
    const cached = JSON.parse(fs.readFileSync(`${root}/role-evidence.json`)).summaries.find(r => r.phase === phase && r.width === row.width && r.id === row.id)
    assert.ok(cached && fs.existsSync(`${root}/${cached.sheet}`), 'compacted evidence must retain its actual strip')
    summaries.push(cached)
    continue
   }
   const images = row.samples.map(s => 'data:image/png;base64,' + fs.readFileSync(`${dir}/${s.file}`).toString('base64'))
   const result = await page.evaluate(async ({ images, row }) => {
    const loaded = await Promise.all(images.map(src => new Promise(resolve => { const img = new Image(); img.onload = () => resolve(img); img.src = src })))
    const left = Math.max(0, Math.floor(row.bounds.left) - 8), top = Math.max(0, Math.floor(row.bounds.top) - 8)
    const width = Math.min(row.width - left, Math.ceil(row.bounds.right) - left + 8), height = Math.min(row.height - top, Math.ceil(row.bounds.bottom) - top + 8)
    const crops = loaded.map(img => { const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, left, top, width, height, 0, 0, width, height); return { png: canvas.toDataURL(), pixels: ctx.getImageData(0, 0, width, height).data } })
    const changedPixels = Math.max(...crops.slice(1).map(c => { let changed = 0; for (let i = 0; i < c.pixels.length; i += 4) if (Math.max(...[0, 1, 2].map(k => Math.abs(c.pixels[i + k] - crops[0].pixels[i + k]))) > 24) changed++; return changed }))
    const sheet = document.createElement('canvas'); sheet.width = Math.max(960, (width + 12) * crops.length); sheet.height = height + 55
    const ctx = sheet.getContext('2d'); ctx.fillStyle = '#f5f3ed'; ctx.fillRect(0, 0, sheet.width, sheet.height); ctx.fillStyle = '#111'; ctx.font = '14px sans-serif'; ctx.fillText(`${row.width}px: ${row.id} | camera ${row.stage} | fixed-camera actor poses`, 8, 18)
    loaded.forEach((img, i) => { ctx.drawImage(img, left, top, width, height, i * (width + 12), 30, width, height); ctx.fillText(row.samples[i].p.toFixed(4), i * (width + 12), height + 46) })
    return { changedPixels, crop: { left, top, width, height }, png: sheet.toDataURL() }
   }, { images, row })
   const filename = `${row.width}-${row.id}-sheet.png`
   fs.writeFileSync(`${dir}/${filename}`, Buffer.from(result.png.split(',')[1], 'base64'))
   summaries.push({ phase, width: row.width, id: row.id, changedPixels: result.changedPixels, crop: result.crop, surfaceExcursionPx: row.maxDisplacement, sheet: `${phase}-roles/${filename}` })
  }
 }
 const baseline = JSON.parse(fs.readFileSync(`${root}/baseline-roles/results.json`)), after = JSON.parse(fs.readFileSync(`${root}/after-roles/results.json`))
 let patientError = 0
 for (const a of after.filter(r => r.id === 'patient-seated')) { const b = baseline.find(r => r.id === a.id && r.width === a.width); a.samples.forEach((s, i) => Object.entries(s.bones).forEach(([bone, values]) => values.forEach((v, j) => { patientError = Math.max(patientError, Math.abs(v - b.samples[i].bones[bone][j])) }))) }
 const pairwise = []
 for (const phase of ['baseline', 'after']) {
  const rows = (phase === 'baseline' ? baseline : after).filter(r => r.width === 1440 && r.id !== 'patient-seated')
  const vectors = rows.map(r => r.samples.flatMap(s => ['L', 'R'].flatMap(side => s.overlays[`lowerarm01.${side}`].slice(0, 3).map(Math.abs))))
  const cosine = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0) / (Math.hypot(...a) * Math.hypot(...b))
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
   const mirrored = vectors[j].flatMap((_, k, a) => k % 6 === 0 ? [...a.slice(k + 3, k + 6), ...a.slice(k, k + 3)] : [])
   pairwise.push({ phase, a: rows[i].id, b: rows[j].id, similarityIncludingMirror: Math.max(cosine(vectors[i], vectors[j]), cosine(vectors[i], mirrored)) })
  }
 }
 fs.writeFileSync(`${root}/role-evidence.json`, JSON.stringify({ summaries, patientError, pairwise, limitation: 'Pixel counts and projected geometry demonstrate nontrivial screen changes, not semantic or anatomical visual acceptance. Implementer cannot inspect images.' }, null, 2))
 fs.writeFileSync(`${root}/role-contact-sheets.html`, `<!doctype html><title>Clinic role evidence</title><style>body{font:15px system-ui;background:#f5f3ed}img{display:block;max-width:100%;border:1px solid #bbb;margin:10px 0}</style><h1>Fixed-camera actor evidence</h1><p>Each strip holds the approved stage camera fixed while scrubbing only actor clips. No visual acceptance claimed. Patient before/after bone error: ${patientError}.</p>${summaries.map(s => `<h2>${s.phase}: ${s.width}px ${s.id}</h2><p>${s.surfaceExcursionPx.toFixed(1)}px projected surface excursion; ${s.changedPixels} high-contrast changed crop pixels.</p><img src="${s.sheet}">`).join('')}`)
 console.log(JSON.stringify({ patientError, rows: summaries.map(({ crop, sheet, ...r }) => r), maxAfterSimilarity: Math.max(...pairwise.filter(r => r.phase === 'after').map(r => r.similarityIncludingMirror)) }, null, 2))
 assert.equal(summaries.length, 24)
 assert.equal(patientError, 0, 'patient authored transforms unchanged')
 for (const row of summaries.filter(r => r.phase === 'after')) assert.ok(row.changedPixels >= 200, `${row.id}: meaningful pixels in actor crop, not only bone epsilon`)
 for (const row of pairwise.filter(r => r.phase === 'after')) assert.ok(row.similarityIncludingMirror < .985, `${row.a}/${row.b}: no normalized/mirrored duplicate arm rhythm`)
 if (process.argv.includes('--compact')) for (const phase of ['baseline', 'after']) {
  const dir = `${root}/${phase}-roles`, rows = phase === 'baseline' ? baseline : after
  for (const row of rows) for (const sample of row.samples) if (!sample.file.endsWith('-0.4.png')) fs.rmSync(`${dir}/${sample.file}`, { force: true })
  fs.writeFileSync(`${dir}/contact-sheet.html`, `<!doctype html><title>${phase} roles</title><h1>${phase} role evidence</h1><a href="../role-contact-sheets.html">All cropped six-pose strips and pixel measurements</a>${rows.map(r => `<h2>${r.width}px ${r.id}</h2><a href="${r.samples[2].file}">Full midpoint frame</a><p><img style="max-width:100%" src="${r.width}-${r.id}-sheet.png"></p>`).join('')}`)
 }
} finally { await browser.close() }
