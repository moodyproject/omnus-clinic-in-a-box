/**
 * shared dimensions of the omnus appliance and the miniature clinic inside.
 * everything in meters; the device floats on low feet above the ground plane.
 *
 * the device is a compact desktop appliance: a dark chassis base (which is
 * also the clinic's floor slab) and a one-piece satin anodized sleeve that
 * lifts off it during the journey.
 */
export const DEVICE = {
  /** footprint width / depth (square plan) */
  w: 1.36,
  d: 1.36,
  /** foot height: the shadow gap under the chassis */
  footH: 0.028,
  /** chassis height (sits on the feet) */
  chassisH: 0.104,
  /** sleeve height including its integrated top */
  sleeveH: 0.81,
  /** corner radius of the sleeve */
  radius: 0.065,
  /** how far the sleeve lifts when the device opens */
  lift: 1.28,
  /** additional lift during the overhead scene */
  overheadLift: 0.85,
} as const

/** y of the chassis top = the clinic floor slab surface */
export const CHASSIS_TOP = DEVICE.footH + DEVICE.chassisH

/** y of the sleeve's resting base */
export const SLEEVE_BASE = CHASSIS_TOP

/** closed device total height */
export const DEVICE_TOP = SLEEVE_BASE + DEVICE.sleeveH

export const CLINIC = {
  /** interior floor surface height (chassis top plus the floor inlay) */
  floorY: CHASSIS_TOP + 0.004,
  /** interior half-extent in x/z (leaves a service apron on the chassis) */
  half: 0.57,
  /** partition wall height (architectural model cutaway) */
  wallH: 0.235,
  /** center of the intelligence core */
  core: { x: 0, z: -0.04 },
} as const
