import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
const names = ['clinic-shell', 'consultation', 'physician-seated', 'patient-seated', 'room-people']
const root = 'public/models/3d-redesign/'
for (const name of names) assert.ok(fs.existsSync(`${root}${name}.glb`), `accepted asset missing: ${name}`)
const manifest = JSON.parse(fs.readFileSync('docs/clinic-model-provenance.json', 'utf8'))
for (const asset of manifest.imported_assets) {
 const bytes = fs.readFileSync(asset.path)
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.path)
}
const documents = names.map(name => {
 const bytes = fs.readFileSync(`${root}${name}.glb`)
 assert.equal(bytes.readUInt32LE(0), 0x46546c67)
 return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
})
for (const name of ['Reception_Staff','Reception_Visitor','Review_Physician','Follow_Coordinator']) {
 assert.ok(documents[4].nodes.some(n => n.name === name), `missing ${name}`)
}
assert.ok(documents.slice(0,2).flatMap(d => d.nodes).some(n => n.extras?.architectureKind === 'solid'))
assert.ok(documents[1].nodes.some(n => n.name.includes('Exam')))
console.log('PASS five sealed accepted GLBs, four new named occupants, architecture metadata, provenance hashes')
