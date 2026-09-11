import * as THREE from 'three'
const chartUpdates = new WeakMap<THREE.Object3D, (p: number) => void>()

/** Illustrative paper-sized clinical chart. Textures are baked once, never on scroll. */
export function addPhysicianChart(actor: THREE.Object3D) {
  const existing = chartUpdates.get(actor)
  if (existing) return existing
  const wrists: THREE.Bone[] = []
  actor.traverse(node => { if (node instanceof THREE.Bone && ['wrist.L', 'wrist.R'].includes(node.userData.name ?? node.name)) wrists.push(node) })
  const chart = new THREE.Group()
  chart.name = 'physician-clinical-chart'
  const frame = new THREE.Mesh(new THREE.BoxGeometry(.43, .018, .31), new THREE.MeshStandardMaterial({ color: '#34483f', roughness: .85 }))
  chart.add(frame)
  const labels = ['DRAFT', 'REVIEWED', 'APPROVED', 'FOLLOW-UP', 'AUTHORIZED', 'HANDOFF']
  const screens = labels.map((label, index) => {
    const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#faf8ee'; ctx.fillRect(0, 0, 384, 256)
    ctx.fillStyle = index === 0 || index === 3 ? '#86652b' : '#22664e'; ctx.fillRect(0, 0, 384, 62)
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 35px sans-serif'; ctx.fillText(label, 18, 44)
    ctx.fillStyle = '#34483f'; ctx.font = '22px sans-serif'; ctx.fillText(index < 3 ? 'Visit note' : 'Referral / return visit', 20, 98)
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#adb7b0'; ctx.fillRect(22, 118 + i * 28, 270 - i * 45, 7) }
    ctx.fillStyle = '#22664e'; ctx.font = 'bold 22px sans-serif'; ctx.fillText(index === 2 ? 'Physician signed' : index === 4 ? 'Physician decision' : index === 5 ? 'Coordination ready' : 'Illustrative workflow', 20, 237)
    if (index === 1 || index === 2 || index >= 4) { ctx.strokeStyle = '#22664e'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(310, 145); ctx.lineTo(326, 164); ctx.lineTo(365, 116); ctx.stroke() }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(.405, .285), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide }))
    screen.name = `physician-chart-${label.toLowerCase()}`; screen.position.y = .010; screen.rotation.set(-Math.PI / 2, 0, Math.PI)
    chart.add(screen); return screen
  })
  actor.add(chart)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), orientation = new THREE.Quaternion()
  chart.visible = false
  const update = (p: number) => {
    chart.visible = (p >= .618 && p <= .658) || (p >= .718 && p <= .779)
    if (!chart.visible || wrists.length !== 2) return
    actor.updateMatrixWorld(true)
    wrists[0].getWorldPosition(a); wrists[1].getWorldPosition(b)
    actor.worldToLocal(a.add(b).multiplyScalar(.5)); a.y -= .025
    chart.position.copy(a)
    // Keep the chart in the physician's hands, not parented to the camera.
    const rig = wrists[0].parent
    let armature: THREE.Object3D | null = rig
    while (armature?.parent && armature.parent !== actor) armature = armature.parent
    if (armature) { armature.getWorldQuaternion(orientation); chart.quaternion.copy(orientation) }
    const state = p < .635 ? 0 : p < .646 ? 1 : p < .66 ? 2 : p < .741 ? 3 : p < .757 ? 4 : 5
    screens.forEach((screen, index) => { screen.visible = index === state })
    chart.userData.state = labels[state]
  }
  chartUpdates.set(actor, update)
  return update
}
