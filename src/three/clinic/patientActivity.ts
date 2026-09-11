import * as THREE from 'three'

/** Keep the accepted seated body/feet; the activity overlay supplies motion. */
export function seatedPatientClip(source: THREE.AnimationClip) {
  const clip = source.clone()
  for (const track of clip.tracks) {
    const size = track.values.length / track.times.length
    const interpolant = track instanceof THREE.QuaternionKeyframeTrack
      ? new THREE.QuaternionLinearInterpolant(track.times, track.values, size)
      : new THREE.LinearInterpolant(track.times, track.values, size)
    const value = Array.from(interpolant.evaluate(source.duration * 0.47) as ArrayLike<number>)
    track.times = new Float32Array([0, source.duration])
    track.values = new Float32Array([...value, ...value])
  }
  return clip
}

/** A small owned tablet rests on her lap, not on the moving doctor. */
export function addPatientIntakeTablet(actor: THREE.Object3D) {
  if (actor.getObjectByName('patient-intake-tablet')) return
  const wrists: THREE.Bone[] = []
  actor.traverse(node => {
    if (node instanceof THREE.Bone && ['wrist.L', 'wrist.R'].includes(node.userData.name ?? node.name)) wrists.push(node)
  })
  if (wrists.length !== 2) return
  actor.updateMatrixWorld(true)
  const center = wrists[0].getWorldPosition(new THREE.Vector3()).add(wrists[1].getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5)
  actor.worldToLocal(center)
  center.y -= 0.035
  center.z += 0.035
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 192
  const context = canvas.getContext('2d')
  if (!context) return
  context.fillStyle = '#f6f5ef'; context.fillRect(0, 0, 256, 192)
  context.fillStyle = '#425c51'; context.font = 'bold 20px sans-serif'; context.fillText('INTAKE', 20, 32)
  for (let i = 0; i < 4; i++) {
    context.strokeStyle = '#6f8f83'; context.lineWidth = 3; context.strokeRect(20, 56 + i * 30, 13, 13)
    context.fillStyle = '#a6aeaa'; context.fillRect(46, 59 + i * 30, 168 - i * 16, 6)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const tablet = new THREE.Group()
  tablet.name = 'patient-intake-tablet'
  tablet.position.copy(center)
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.015, 0.22), new THREE.MeshStandardMaterial({ color: '#334047', roughness: 0.7 }))
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.274, 0.194), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }))
  screen.position.y = 0.008
  screen.rotation.set(-Math.PI / 2, 0, Math.PI)
  tablet.add(frame, screen)
  actor.add(tablet)
}
