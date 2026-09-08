import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as THREE from 'three'
const modulePath = 'src/three/clinic/acceptedModel.ts'
assert.ok(fs.existsSync(modulePath), 'accepted wall adapter missing')
const { createWallCutaway, disposeModel } = await import('../'+modulePath)
const root=new THREE.Group();root.scale.setScalar(.1);root.position.y=.136
const wall=new THREE.Mesh(new THREE.BoxGeometry(1,2.35,.15),new THREE.MeshStandardMaterial());wall.position.y=1.175;wall.userData.architectureKind='solid';root.add(wall)
const fixture=new THREE.Mesh(new THREE.BoxGeometry(.4,.4,.05),new THREE.MeshStandardMaterial());fixture.position.y=1.7;fixture.userData.architectureKind='fixture';root.add(fixture)
root.updateMatrixWorld(true)
const original=Array.from(wall.geometry.attributes.position.array)
const cut=createWallCutaway(root)
for(const amount of [0,.5,1,.5,0]){
 cut(amount);root.updateMatrixWorld(true)
 const bounds=new THREE.Box3().setFromObject(wall)
 assert.ok(Math.abs(bounds.max.y-(.136+.235-.2*amount))<1e-6)
 assert.ok(bounds.min.y>=.136-1e-6,'no underfloor geometry')
 assert.equal(fixture.visible,amount===0)
}
assert.deepEqual(Array.from(wall.geometry.attributes.position.array),original,'exact reverse restoration')
let disposed=0;wall.geometry.addEventListener('dispose',()=>disposed++)
disposeModel(root);assert.equal(disposed,1)
console.log('PASS translated/scaled closed-half-open-reverse wall plane, fixtures, exact restoration and disposal')
