import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { CLINIC } from '../../constants'
import { smoothedState } from '../../../scroll/journey'
import { getSharedShadowTexture } from '../../textures'
import { useOutfit, applyWardrobe, type OutfitId } from './loader'
import { evalTrack, type ClipName, type PersonPose, type Seg } from './tracks'

const FLOOR = CLINIC.floorY
/** the clinic is a 1:10 architectural model; source characters are ~1.8m */
const MODEL_SCALE = 0.1

/**
 * lower-body pose for sitting. the rig's pelvis bone is "Body"; the feet are
 * ik-style bones parented to "Root". guessing local euler signs across the
 * two source rigs proved unreliable, so seated legs are solved analytically:
 * a two-bone ik per leg places the knee, orients thigh and shin, and pins the
 * foot at the chain's end. everything blends with the seated factor, so the
 * walk-to-sit transition scrubs cleanly in both scroll directions.
 */
const SIT = {
  bodyDrop: 0.5,
  bodyBack: 0.05,
  spineLean: 0.14,
  ankleY: 0.06,
  ankleForward: 0.42,
}

// dev-only pose tuning: ?sit=drop,back,lean,ankleY,ankleForward
if (import.meta.env.DEV) {
  const raw = new URLSearchParams(window.location.search).get('sit')
  if (raw) {
    const v = raw.split(',').map(Number)
    const keys = ['bodyDrop', 'bodyBack', 'spineLean', 'ankleY', 'ankleForward'] as const
    keys.forEach((k, i) => {
      if (v[i] !== undefined && !Number.isNaN(v[i])) SIT[k] = v[i]
    })
  }
}

const _H = new THREE.Vector3()
const _F = new THREE.Vector3()
const _K = new THREE.Vector3()
const _axis = new THREE.Vector3()
const _pole = new THREE.Vector3()
const _x = new THREE.Vector3()
const _y = new THREE.Vector3()
const _z = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _qWorld = new THREE.Quaternion()
const _qParent = new THREE.Quaternion()

/** orient a +Y-along-bone joint so it points from `from` to `to` in armature
 *  space, keeping its local +Z roughly toward `poleDir` (the knee's facing) */
function aimBone(
  bone: THREE.Object3D,
  from: THREE.Vector3,
  to: THREE.Vector3,
  poleDir: THREE.Vector3,
) {
  _y.subVectors(to, from).normalize()
  _z.copy(poleDir).addScaledVector(_y, -poleDir.dot(_y)).normalize()
  _x.crossVectors(_y, _z)
  _m.makeBasis(_x, _y, _z)
  _qWorld.setFromRotationMatrix(_m)
  bone.parent!.getWorldQuaternion(_qParent)
  bone.quaternion.copy(_qParent.invert().multiply(_qWorld))
}

export interface PersonSpec {
  outfit: OutfitId
  /** source material name -> palette hex */
  colors: Record<string, string>
  /** color for any material not listed */
  fallback: string
  track: Seg[]
  /** de-syncs loop clips between people */
  phase?: number
  /** small height variation across the cast */
  height?: number
}

const poseScratch: PersonPose = { x: 0, z: 0, yaw: 0, sit: 0, clips: [], look: null }

/**
 * one miniature person: a cloned skinned character whose position, facing,
 * seated factor and clip times all derive from normalized scroll progress.
 */
export function Person({ spec }: { spec: PersonSpec }) {
  const gltf = useOutfit(spec.outfit)
  const groupRef = useRef<THREE.Group>(null)

  const rig = useMemo(() => {
    if (!gltf) return null
    const scene = cloneSkeleton(gltf.scene)
    applyWardrobe(scene, spec.colors, spec.fallback)

    const bones: Record<string, THREE.Object3D> = {}
    const rest: { bone: THREE.Object3D; p: THREE.Vector3; q: THREE.Quaternion }[] = []
    scene.traverse((obj) => {
      if ((obj as THREE.Bone).isBone) {
        bones[obj.name] = obj
        rest.push({ bone: obj, p: obj.position.clone(), q: obj.quaternion.clone() })
      }
    })

    const mixer = new THREE.AnimationMixer(scene)
    const actions = new Map<ClipName, THREE.AnimationAction>()
    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip)
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.play()
      action.enabled = false
      actions.set(clip.name as ClipName, action)
    }
    // leg lengths for the seated ik, measured lazily once world matrices
    // exist (the render scale is applied outside this memo)
    const legs = { l1: 0, l2: 0, ready: false }
    return { scene, mixer, actions, bones, rest, legs }
  }, [gltf, spec.colors, spec.fallback])

  useEffect(() => {
    return () => {
      if (!rig) return
      rig.mixer.stopAllAction()
      rig.mixer.uncacheRoot(rig.scene)
    }
  }, [rig])

  useFrame(() => {
    const group = groupRef.current
    if (!group || !rig) return
    // the clinic group is hidden while the appliance is closed
    if (!group.parent?.visible && smoothedState.p < 0.1) return

    const pose = poseScratch
    evalTrack(spec.track, smoothedState.p, spec.phase ?? 0, pose)

    group.position.set(pose.x, FLOOR, pose.z)
    group.rotation.y = pose.yaw

    // restore the rest pose first: the clips do not animate every bone, and
    // the seated/look overrides below are deltas that must never accumulate
    for (const { bone, p, q } of rig.rest) {
      bone.position.copy(p)
      bone.quaternion.copy(q)
    }

    for (const action of rig.actions.values()) {
      action.enabled = false
    }
    for (const entry of pose.clips) {
      const action = rig.actions.get(entry.name)
      if (!action) continue
      const duration = action.getClip().duration
      action.enabled = true
      action.setEffectiveWeight(entry.weight)
      action.time = ((entry.time % duration) + duration) % duration
    }
    rig.mixer.update(0)

    // seated override: pose the lower body over whatever the clip produced
    const sit = pose.sit
    if (sit > 0.001) {
      const { bones, legs } = rig
      const scale = MODEL_SCALE * height

      if (!legs.ready) {
        // measure once with valid world matrices (includes the render scale)
        const thigh = bones['UpperLegL']
        const shin = bones['LowerLegL']
        const foot = bones['FootL']
        if (thigh && shin && foot) {
          thigh.getWorldPosition(_H)
          shin.getWorldPosition(_K)
          foot.getWorldPosition(_F)
          legs.l1 = _H.distanceTo(_K)
          legs.l2 = _K.distanceTo(_F)
          legs.ready = legs.l1 > 0.001 && legs.l2 > 0.001
        }
      }

      const body = bones['Body']
      if (body) {
        body.position.y -= SIT.bodyDrop * sit
        body.position.z -= SIT.bodyBack * sit
      }
      const spine = bones['Hips']
      if (spine) spine.rotateX(SIT.spineLean * sit)

      if (legs.ready) {
        // character forward in world space
        _pole.set(Math.sin(pose.yaw), 0, Math.cos(pose.yaw))
        const floorY = group.position.y

        for (const side of ['L', 'R'] as const) {
          // gltfloader sanitizes bone names: "UpperLeg.L" -> "UpperLegL"
          const thigh = bones[`UpperLeg${side}`]
          const shin = bones[`LowerLeg${side}`]
          const foot = bones[`Foot${side}`]
          if (!thigh || !shin || !foot) continue

          // blend the ankle from where the clip put it toward the seat front
          foot.getWorldPosition(_F)
          thigh.getWorldPosition(_H)
          _K.copy(_H).addScaledVector(_pole, SIT.ankleForward * scale)
          _K.y = floorY + SIT.ankleY * scale
          _F.lerp(_K, sit)

          // two-bone ik: knee position from the hip-ankle pair
          _axis.subVectors(_F, _H)
          let d = _axis.length()
          const maxD = legs.l1 + legs.l2 - 0.0005
          const minD = Math.abs(legs.l1 - legs.l2) + 0.0005
          if (d > maxD) d = maxD
          if (d < minD) d = minD
          _axis.normalize()
          const a = (legs.l1 * legs.l1 - legs.l2 * legs.l2 + d * d) / (2 * d)
          const r = Math.sqrt(Math.max(legs.l1 * legs.l1 - a * a, 0))
          _z.copy(_pole).addScaledVector(_axis, -_pole.dot(_axis)).normalize()
          _K.copy(_H).addScaledVector(_axis, a).addScaledVector(_z, r)
          // recompute the clamped ankle from the actual chain
          _F.copy(_H).addScaledVector(_axis, d)

          aimBone(thigh, _H, _K, _pole)
          thigh.updateWorldMatrix(true, false)
          aimBone(shin, _K, _F, _pole)

          // pin the foot bone at the chain's end (it parents to Root)
          const root = foot.parent!
          root.updateWorldMatrix(true, false)
          _m.copy(root.matrixWorld).invert()
          foot.position.copy(_F).applyMatrix4(_m)
        }
      }
    }

    // restrained head turn toward a point of interest
    if (pose.look) {
      const neck = rig.bones['Neck']
      if (neck) {
        const target = Math.atan2(pose.look[0] - pose.x, pose.look[1] - pose.z)
        let delta = (target - pose.yaw) % (Math.PI * 2)
        if (delta > Math.PI) delta -= Math.PI * 2
        if (delta < -Math.PI) delta += Math.PI * 2
        delta = Math.max(-0.55, Math.min(0.55, delta))
        neck.rotation.y += delta * 0.7
      }
    }
  })

  const height = spec.height ?? 1

  if (!rig) return null
  return (
    <group ref={groupRef} name={`person-${spec.outfit}`}>
      {/* soft contact shadow keeps feet visually planted */}
      <mesh position={[0, 0.002, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.075, 0.075]} />
        <meshBasicMaterial
          map={getSharedShadowTexture()}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
      <primitive object={rig.scene} scale={MODEL_SCALE * height} />
    </group>
  )
}
