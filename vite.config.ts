import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { PACK_URL } from './src/three/clinic/pack/manifest'

/**
 * Start the clinic model pack download from the HTML itself, in parallel
 * with the JS bundle, instead of after React/three have booted. The URL is
 * content-addressed and comes from the generated pack manifest.
 */
function preloadClinicPack(): Plugin {
  let base = '/'
  return {
    name: 'preload-clinic-pack',
    configResolved(config) { base = config.base },
    transformIndexHtml() {
      // crossorigin=anonymous matches fetch()'s default same-origin
      // credentials mode, so the runtime fetch reuses this response.
      return [{ tag: 'link', attrs: { rel: 'preload', href: `${base}${PACK_URL}`, as: 'fetch', crossorigin: 'anonymous', fetchpriority: 'high' }, injectTo: 'head-prepend' }]
    },
  }
}

export default defineConfig({
  plugins: [react(), preloadClinicPack()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4174, strictPort: true },
  build: {
    target: 'es2022',
    // three.js is intentionally one large cached chunk
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          vendor: ['react', 'react-dom', 'gsap'],
        },
      },
    },
  },
})
