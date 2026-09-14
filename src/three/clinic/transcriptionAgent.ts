import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

/** An additive, floor-planted scribe. All motion is an absolute-progress pose;
 * the existing scene owner disposes its meshes/materials with the clinic. */
export function createTranscriptionAgent(root: THREE.Group) {
  let actor = root.getObjectByName('Transcription_Agent') as THREE.Group | undefined
  if (!actor) {
    actor = new THREE.Group()
    actor.name = 'Transcription_Agent'
    actor.userData.representation = 'omnus-robot'
    actor.userData.role = 'transcription-ai'
    // Offset from the conversation axis to clear the doctor's entry turn.
    actor.position.set(3.8, 0, 3.2)
    actor.rotation.y = -Math.PI / 2
    actor.scale.setScalar(.82)
    root.add(actor)
    const metal = new THREE.MeshStandardMaterial({ color: '#70777f', roughness: .42, metalness: .25, envMapIntensity: .15 })
    const dark = new THREE.MeshStandardMaterial({ color: '#30343b', roughness: .5, metalness: .25, envMapIntensity: .15 })
    const black = new THREE.MeshStandardMaterial({ color: '#141a20', roughness: .65 })
    const pale = new THREE.MeshStandardMaterial({ color: '#f1f9ee', roughness: .65 })
    const mint = new THREE.MeshStandardMaterial({ color: '#66efc4', roughness: .5, emissive: '#66efc4', emissiveIntensity: .2 })
    const mesh = (name: string, geometry: THREE.BufferGeometry, material: THREE.Material, xyz: [number, number, number], parent: THREE.Object3D = actor!) => {
      const n = new THREE.Mesh(geometry, material)
      n.name = `scribe-${name}`;n.position.set(...xyz)
      n.castShadow = true;n.receiveShadow = true;n.userData.robotPart = true
      parent.add(n);return n
    }
    const box = (name: string, size: [number, number, number], material: THREE.Material, xyz: [number, number, number], parent: THREE.Object3D = actor!) => mesh(name, new RoundedBoxGeometry(...size, 2, Math.min(...size) * .18), material, xyz, parent)
    const shaft = (name: string, a: [number, number, number], b: [number, number, number], radius: number) => {
      const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from)
      const n = mesh(name, new THREE.CylinderGeometry(radius, radius, delta.length(), 12), metal, from.lerp(to, .5).toArray())
      n.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize())
      return n
    }
    for (const side of [-1, 1]) {
      const x = side * .115
      box(`foot-${side}`, [.13, .09, .24], dark, [x, .045, .055])
      shaft(`shin-${side}`, [x, .09, 0], [x, .40, 0], .054)
      mesh(`knee-${side}`, new THREE.SphereGeometry(.061, 10, 8), dark, [x, .40, 0])
      shaft(`thigh-${side}`, [x, .40, 0], [x, .72, 0], .07)
      for (const y of [.20, .29, .51, .60]) mesh(`band-${side}-${y}`, new THREE.CylinderGeometry(.073, .073, .013, 12), dark, [x, y, 0])
    }
    box('hips', [.30, .16, .24], metal, [0, .75, 0])
    mesh('waist', new THREE.CylinderGeometry(.12, .12, .15, 12), dark, [0, .87, 0])
    mesh('torso', new THREE.CylinderGeometry(.153, .171, .315, 16), metal, [0, 1.04, 0])
    mesh('badge', new THREE.TorusGeometry(.047, .01, 5, 16), mint, [0, 1.065, .158])
    mesh('neck', new THREE.CylinderGeometry(.05, .05, .12, 12), dark, [0, 1.23, 0])
    const head = new THREE.Group();head.name = 'scribe-head';head.position.y = 1.36;actor.add(head)
    mesh('head-shell', new THREE.CylinderGeometry(.115, .115, .245, 16), metal, [0, 0, 0], head)
    mesh('dome', new THREE.SphereGeometry(.115, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), metal, [0, .1225, 0], head)
    box('visor', [.22, .093, .055], black, [0, .035, .115], head)
    for (const side of [-1, 1]) {
      mesh(`eye-${side}`, new THREE.SphereGeometry(.034, 12, 8), pale, [side * .049, .035, .144], head)
      mesh(`pupil-${side}`, new THREE.SphereGeometry(.014, 8, 6), black, [side * .049, .032, .174], head)
      box(`ear-${side}`, [.04, .084, .093], dark, [side * .132, 0, 0], head)
    }
    box('mouth', [.124, .03, .014], dark, [0, -.065, .116], head)
    for (const x of [-.04, 0, .04]) box(`tooth-${x}`, [.01, .025, .018], metal, [x, -.065, .125], head)
    const tablet = new THREE.Group();tablet.name = 'scribe-tablet';tablet.position.set(0, .94, .29);tablet.rotation.x = -2;actor.add(tablet)
    box('tablet-frame', [.34, .26, .028], dark, [0, 0, 0], tablet)
    box('tablet-screen', [.30, .22, .006], black, [0, 0, .018], tablet)
    for (let i = 0; i < 5; i++) box(`note-${i}`, [.20 - (i % 2) * .04, .008, .003], mint, [-.02, .07 - i * .033, .023], tablet)
    shaft('left-upper', [-.18, 1.14, 0], [-.24, .89, .16], .049)
    shaft('left-forearm', [-.24, .89, .16], [-.16, .90, .20], .042)
    box('left-hand', [.08, .055, .085], metal, [-.16, .90, .20])
    shaft('right-upper', [.18, 1.14, 0], [.25, .99, .18], .049)
    mesh('right-elbow', new THREE.SphereGeometry(.055, 10, 8), dark, [.25, .99, .18])
    mesh('right-forearm', new THREE.CylinderGeometry(.042, .042, 1, 12), metal, [0, 0, 0])
    box('right-hand', [.07, .045, .07], metal, [0, 0, 0])
    mesh('stylus', new THREE.CylinderGeometry(.008, .008, .15, 8), pale, [0, 0, 0])
  }
  const head = actor.getObjectByName('scribe-head')!, tablet = actor.getObjectByName('scribe-tablet')!
  const forearm = actor.getObjectByName('scribe-right-forearm')!, hand = actor.getObjectByName('scribe-right-hand')!, pen = actor.getObjectByName('scribe-stylus')!
  const elbow = new THREE.Vector3(.25, .99, .18), target = new THREE.Vector3(), grip = new THREE.Vector3(), delta = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0)
  tablet.updateMatrix()
  // The display's +Z normal points up and inward at the robot's face.
  // Keep the writing grip on that side as the stylus follows the screen.
  const screenNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(tablet.quaternion)
  return (progress: number) => {
    const p = THREE.MathUtils.clamp(progress, .40, .55), phase = (p - .40) * 500
    head.rotation.set(.13 + .035 * Math.sin(phase * .17), .07 * Math.sin(phase * .11), 0)
    target.set(.015 + .062 * Math.sin(phase), .025 + .04 * Math.sin(phase * .31), .024).applyMatrix4(tablet.matrix)
    grip.copy(target).addScaledVector(screenNormal, .10);grip.x += .025;hand.position.copy(grip)
    delta.subVectors(grip, elbow);forearm.position.copy(elbow).lerp(grip, .5)
    forearm.scale.y = delta.length();forearm.quaternion.setFromUnitVectors(up, delta.normalize())
    delta.subVectors(grip, target).normalize();pen.position.copy(target).addScaledVector(delta, .075);pen.quaternion.setFromUnitVectors(up, delta)
  }
}
