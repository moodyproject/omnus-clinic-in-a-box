/**
 * shared dimensions of the omnus appliance and the miniature clinic inside.
 * everything in meters; the device stands on the ground plane at y = 0.
 */
export const DEVICE = {
  /** footprint width / depth */
  w: 1.26,
  d: 1.26,
  /** base plinth height */
  plinthH: 0.06,
  /** main shell height (sits on the plinth) */
  shellH: 1.78,
  /** lifted top cap height */
  capH: 0.12,
  /** corner radius of the enclosure */
  radius: 0.075,
  /** how far each shell half slides out when the device opens */
  slide: 0.66,
  /** how far the top cap lifts */
  lift: 0.72,
} as const

export const CLINIC = {
  /** interior floor slab: top surface height */
  floorY: 0.115,
  /** interior half-extent in x/z */
  half: 0.57,
  /** partition wall height (architectural model cutaway) */
  wallH: 0.3,
  /** ceiling track height */
  ceilY: 0.68,
  /** center of the intelligence core */
  core: { x: 0, z: -0.04 },
} as const

/** shell top = plinth + shell */
export const SHELL_TOP = DEVICE.plinthH + DEVICE.shellH
