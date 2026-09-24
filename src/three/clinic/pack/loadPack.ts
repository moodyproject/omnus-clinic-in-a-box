import { PACK_FILES, PACK_TOTAL, PACK_URL } from './manifest'

/**
 * Fetches the single zstd transport pack and slices it back into the exact
 * original GLB byte ranges. index.html preloads the same URL (same
 * credentials mode), so this fetch normally reuses the in-flight preload
 * instead of waiting for the JS bundle before the download starts.
 */
export async function loadClinicPack(base: string, signal: AbortSignal) {
  const decoderReady = import('three/addons/libs/zstddec.module.js').then(async ({ ZSTDDecoder }) => {
    const decoder = new ZSTDDecoder()
    await decoder.init()
    return decoder
  })
  const response = await fetch(`${base}${PACK_URL}`, { signal })
  if (!response.ok) throw new Error('Clinic asset unavailable')
  const packed = new Uint8Array(await response.arrayBuffer())
  signal.throwIfAborted()
  const decoder = await decoderReady
  signal.throwIfAborted()
  const bytes = decoder.decode(packed, PACK_TOTAL)
  if (bytes.byteLength !== PACK_TOTAL) throw new Error('Clinic asset corrupt')
  const glbs = new Map<string, ArrayBuffer>()
  for (const file of PACK_FILES) {
    // GLTFLoader.parse wants an ArrayBuffer that starts at the GLB header.
    const glb = bytes.slice(file.offset, file.offset + file.length)
    if (new DataView(glb.buffer).getUint32(0, true) !== 0x46546c67) throw new Error('Clinic asset corrupt')
    glbs.set(file.name, glb.buffer)
  }
  return glbs
}
