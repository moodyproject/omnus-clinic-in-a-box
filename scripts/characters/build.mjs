/**
 * character asset pipeline: turns the CC0 Quaternius source characters into
 * small meshopt-compressed glbs the site can lazy-load.
 *
 * sources (see ASSETS.md): Ultimate Modular Women Pack and Ultimate Modular
 * Characters (men) by Quaternius, CC0 1.0. the script downloads the .gltf
 * sources from the packs' public folders on first run, strips everything the
 * site does not use (combat/game clips, fingers-only tracks stay), quantizes,
 * and compresses. outputs land in public/characters/.
 *
 * usage: node scripts/characters/build.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, quantize, resample, meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'

const CACHE = path.resolve('scripts/characters/.source-cache')
const OUT = path.resolve('public/characters')

/** animation clips the site actually drives (everything else is dropped) */
const KEEP_CLIPS = new Set(['Idle', 'Idle_Neutral', 'Interact', 'Walk', 'Wave'])

/** drive file ids inside the packs' public download folders */
const SOURCES = {
  // Ultimate Modular Women Pack (CC0) - individual characters, glTF
  'W_Casual.gltf': '18b3WwlrwrFYWAM7BcnjWeIxKJyxAQiGh',
  'W_Formal.gltf': '1iayBzVv_zLjuPtaNPouw_auwKlQLLmes',
  'W_Suit.gltf': '1GjWtofxjmPku25cXJxHrzLLeUbXw7A_s',
  // Ultimate Modular Characters / men (CC0) - individual characters, glTF
  'M_Casual2.gltf': '1Jn7kULNmrtqP8BUUL19h8MhbdOnwPFhv',
  'M_Suit.gltf': '1NhXHnGU0zK9hBrT5FoZp8nTz_EmvTPg5',
}

async function fetchSource(name, id) {
  const file = path.join(CACHE, name)
  if (fs.existsSync(file) && fs.statSync(file).size > 100_000) return file
  const url = `https://drive.google.com/uc?export=download&id=${id}`
  console.log(`downloading ${name} ...`)
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`download failed for ${name}: ${res.status}`)
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  return file
}

async function build() {
  fs.mkdirSync(CACHE, { recursive: true })
  fs.mkdirSync(OUT, { recursive: true })
  await MeshoptEncoder.ready
  await MeshoptDecoder.ready

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
  })

  let total = 0
  for (const [name, id] of Object.entries(SOURCES)) {
    const src = await fetchSource(name, id)
    const doc = await io.read(src)
    const root = doc.getRoot()

    for (const anim of root.listAnimations()) {
      if (!KEEP_CLIPS.has(anim.getName())) {
        anim.dispose()
        continue
      }
      // finger and ik-helper tracks are invisible at 1:10 miniature scale;
      // dropping them halves the channel count and the json overhead
      for (const channel of anim.listChannels()) {
        const target = channel.getTargetNode()?.getName() ?? ''
        if (/^(Index|Middle|Ring|Pinky|Thumb|PT\.)/.test(target)) {
          const sampler = channel.getSampler()
          channel.dispose()
          sampler?.dispose()
        }
      }
    }

    await doc.transform(
      resample(),
      dedup(),
      prune(),
      quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }),
      meshopt({ encoder: MeshoptEncoder, level: 'high' }),
      // resampling the surviving clips leaves accessors from the dropped
      // clips orphaned; a final prune collects them (~100 KB per file)
      prune(),
    )

    const mats = root.listMaterials().map((m) => m.getName())
    const out = path.join(OUT, name.replace('.gltf', '.glb').toLowerCase())
    // round-trip once: accessors orphaned by the dropped clips only become
    // prunable after serialization, and this pass saves ~100 KB per file
    const clean = await io.readBinary(await io.writeBinary(doc))
    await clean.transform(prune())
    await io.write(out, clean)
    const size = fs.statSync(out).size
    total += size
    console.log(
      `${path.basename(out)}  ${(size / 1024).toFixed(0)} KB  materials: ${mats.join(', ')}`,
    )
  }
  console.log(`total: ${(total / 1024).toFixed(0)} KB`)
}

await build()
