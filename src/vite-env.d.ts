/// <reference types="vite/client" />

declare module '@fontsource-variable/geist'

declare module 'three/addons/libs/zstddec.module.js' {
  export class ZSTDDecoder {
    init(): Promise<void>
    decode(array: Uint8Array, uncompressedSize?: number): Uint8Array
  }
}
