/** Compact client-only stages: no URLs, error messages or visitor data. */
export type SceneFailure = 'no-webgl2' | 'renderer-init' | 'scene-render' | 'asset-load' | 'asset-timeout' | 'context-lost'
export const sceneFailureNotes: Record<SceneFailure, string> = {
  'no-webgl2': 'This browser could not provide WebGL2, which the 3D clinic requires. Try checking again, or open this page in an updated Safari or Chrome browser outside the in-app browser.',
  'renderer-init': 'The browser could not start the 3D renderer. Retry with lower rendering quality.',
  'scene-render': 'The 3D scene encountered a rendering error. Retry with lower rendering quality.',
  'asset-load': 'A clinic model could not download or load. Check your connection and retry.',
  'asset-timeout': 'Loading the clinic took too long. Check your connection and retry.',
  'context-lost': 'The browser interrupted the 3D graphics session. Retry with lower rendering quality.',
}
