import * as THREE from 'three'

/** frame-rate independent exponential damping */
export const damp = THREE.MathUtils.damp

export function dampV3(current: THREE.Vector3, target: THREE.Vector3, lambda: number, dt: number) {
  current.x = damp(current.x, target.x, lambda, dt)
  current.y = damp(current.y, target.y, lambda, dt)
  current.z = damp(current.z, target.z, lambda, dt)
}

export const lerp = THREE.MathUtils.lerp
