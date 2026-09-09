/** Compact client-only stages: no URLs, error messages or visitor data. */
export type SceneFailure = 'no-webgl2' | 'renderer-init' | 'scene-render' | 'asset-load' | 'asset-timeout' | 'context-lost'
export type StaticReason = SceneFailure | 'reduced-motion' | 'explicit-static'

export const sceneFailureNotes: Record<StaticReason, string> = {
  'reduced-motion': 'Motion is reduced by your device preference. The full journey is presented as steps.',
  'explicit-static': 'Static view is selected. The complete clinic story is below.',
  'no-webgl2': 'This browser could not provide WebGL2, which the 3D clinic requires. Try checking again, or open this page in an updated Safari or Chrome browser outside the in-app browser.',
  'renderer-init': 'The browser could not start the 3D renderer. You can retry with lower rendering quality, or use the complete static story below.',
  'scene-render': 'The 3D scene encountered a rendering error. You can retry with lower rendering quality, or use the complete static story below.',
  'asset-load': 'A clinic model could not download or load. Check your connection and retry, or explore the saved view and complete story below.',
  'asset-timeout': 'Loading the clinic took too long. Check your connection and retry, or explore the saved view and complete story below.',
  'context-lost': 'The browser interrupted the 3D graphics session. You can retry with lower rendering quality, or use the complete static story below.',
}
