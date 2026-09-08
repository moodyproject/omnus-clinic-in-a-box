import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import {NodeIO} from '@gltf-transform/core'
import {ALL_EXTENSIONS} from '@gltf-transform/extensions'
import {MeshoptDecoder} from 'meshoptimizer'
await MeshoptDecoder.ready
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder})
const hash=b=>crypto.createHash('sha256').update(b).digest('hex')
const reports=[]
for(const name of ['physician-seated','patient-seated','room-people']){
 const before=await io.read(`assets/clinic-motion/local/baseline/models/3d-redesign/${name}.glb`)
 const after=await io.read(`public/models/3d-redesign/${name}.glb`)
 const describe=m=>({name:m.getName(),base:m.getBaseColorFactor(),roughness:m.getRoughnessFactor(),metallic:m.getMetallicFactor(),alpha:m.getAlphaMode(),cutoff:m.getAlphaCutoff(),sided:m.getDoubleSided(),colorTexture:m.getBaseColorTexture()?hash(m.getBaseColorTexture().getImage()):null,normalTexture:m.getNormalTexture()?hash(m.getNormalTexture().getImage()):null})
 const a=before.getRoot().listMaterials().map(describe).sort((a,b)=>a.name.localeCompare(b.name))
 const b=after.getRoot().listMaterials().map(describe).sort((a,b)=>a.name.localeCompare(b.name))
 assert.deepEqual(b,a,`${name}: accepted materials and texture bytes unchanged`)
 assert.ok(after.getRoot().listAnimations().length&&after.getRoot().listSkins().length)
 reports.push({asset:name,materials:a.length,unchangedMaterialAndTextureBytes:true,skins:after.getRoot().listSkins().length,clips:after.getRoot().listAnimations().length})
}
fs.writeFileSync('docs/evidence/clinic-motion/material-identity.json',JSON.stringify(reports,null,2));console.log('PASS',reports)
