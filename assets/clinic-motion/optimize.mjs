import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, meshopt, textureCompress, resample } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'
import sharp from 'sharp'
import fs from 'node:fs'
await MeshoptEncoder.ready; await MeshoptDecoder.ready
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder})
const report=[]
for(const name of ['physician-seated','patient-seated','room-people']){
 const path=`public/models/3d-redesign/${name}.glb`;const doc=await io.read(path)
 fs.copyFileSync(path,`assets/clinic-motion/local/${name}-unoptimized.glb`)
 for(const mat of doc.getRoot().listMaterials())if(['short02','bob02','eyebrow','high-poly'].some(t=>mat.getName().includes(t)))mat.setAlphaMode('MASK').setAlphaCutoff(.4).setDoubleSided(true)
 await doc.transform(dedup(),prune(),resample(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:88}),meshopt({encoder:MeshoptEncoder,level:'medium'}))
 // Re-exporting packed Blender images may change encoding/color management.
 // Reuse exact shipped texture bytes at the unchanged named material seam,
 // rather than silently recoloring the accepted people through re-encoding.
 const baseline=await io.read(`assets/clinic-motion/local/baseline/models/3d-redesign/${name}.glb`)
 for(const mat of doc.getRoot().listMaterials()){
  const accepted=baseline.getRoot().listMaterials().find(m=>m.getName()===mat.getName())
  if(!accepted)throw new Error(`Missing accepted material ${mat.getName()}`)
  for(const getter of ['getBaseColorTexture','getNormalTexture']){
   const texture=mat[getter](),original=accepted[getter]()
   if(!!texture!==!!original)throw new Error(`Texture slot changed: ${mat.getName()} ${getter}`)
   if(texture)texture.setImage(original.getImage()).setMimeType(original.getMimeType())
  }
 }
 await io.write(path,doc)
 report.push({name,bytes:fs.statSync(path).size,skins:doc.getRoot().listSkins().length,animations:doc.getRoot().listAnimations().length})
}
fs.writeFileSync('assets/clinic-motion/local/optimization.json',JSON.stringify(report,null,2));console.log(report)
