import fs from 'node:fs'
import crypto from 'node:crypto'
const path='docs/clinic-model-provenance.json'
const manifest=JSON.parse(fs.readFileSync(path,'utf8'))
const hash=p=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}}
const names=['physician-seated','patient-seated','room-people']
const changed=a=>names.some(n=>a.path.endsWith(`/${n}.glb`))
manifest.motion_repair??={baseline_commit:'fc184f29908f9d84fe4fb2813e8fb532c565759e',baseline_people_assets:manifest.imported_assets.filter(changed)}
manifest.imported_assets=manifest.imported_assets.map(a=>changed(a)?hash(a.path):a)
Object.assign(manifest.motion_repair,{
 task:'t_6ce27686',
 method:'Existing weighted rigs rebound to evaluated accepted seated surfaces, including the patient shirt corrective. No new anatomy/materials. Scroll-seeked authored clips; original six cast, no legacy duplicates.',
 restored:'All six have articulated head/neck/forearm gestures. Patient walks from internal arrival through reception approach and consultation doorway, plants feet and sits for .43-.60, stands .60-.63 and walks onward through central circulation.',
 limits:'Closed accepted perimeter has no exterior opening: arrival and departure remain inside clinic circulation. Check-in gesture is at the reception approach, not a desk transaction. Other seated staff retain lap/interaction gestures, not full keyboard-typing choreography. Stylized procedural gait, not motion capture.',
 editable_sources:names.map(n=>hash(`assets/clinic-motion/local/${n}-motion.blend`)),
 recipes:['assets/clinic-motion/export_motion.py','assets/clinic-motion/patient_path.py','assets/clinic-motion/optimize.mjs','assets/clinic-motion/verify_bind.py'].map(hash),
 original_source_hashes:'source_hashes below remain the unchanged donor baselines; new editable hashes are separate above.'
})
manifest.authored_source='Original accepted donor assets/3d-redesign preserved read-only. Motion derivatives are editable local assets/clinic-motion/local/*.blend (intentionally ignored, not shipped). Reproduction scripts are in assets/clinic-motion/.'
fs.writeFileSync(path,JSON.stringify(manifest,null,2)+'\n')
console.log(manifest.motion_repair.baseline_people_assets,manifest.imported_assets.filter(changed))
