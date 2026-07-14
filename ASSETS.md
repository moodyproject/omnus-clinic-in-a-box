# external assets

every external asset used by this site, with provenance and license. all other
geometry, screens, labels, and textures are generated procedurally at runtime
(see `src/three/textures.ts`) and ship no image or model files.

## miniature human characters

the clinic's cast is built from two CC0 character packs by Quaternius. the
source `.gltf` files are processed by `scripts/characters/build.mjs` (clip
pruning, finger-track removal, resampling, quantization, meshopt compression)
into the runtime `.glb` files in `public/characters/`. original materials are
replaced at load time with palette-matched matte materials
(`src/three/clinic/people/cast.ts`), so no source colors or textures ship.

| asset | source pack | creator | license | modifications | used as |
| --- | --- | --- | --- | --- | --- |
| `w_casual.glb` | Ultimate Modular Women Pack — "Casual" | Quaternius (quaternius.com) | CC0 1.0 Universal | kept 5 of 24 clips, removed finger/ik tracks, quantized + meshopt, recolored at runtime | the patient |
| `w_formal.glb` | Ultimate Modular Women Pack — "Formal" | Quaternius | CC0 1.0 Universal | same | the care coordinator (follow-through) |
| `w_suit.glb` | Ultimate Modular Women Pack — "Suit" | Quaternius | CC0 1.0 Universal | same, jacket recolored to a soft clinic-coat gray | the physician |
| `m_casual2.glb` | Ultimate Modular Characters (men) — "Casual_2" | Quaternius | CC0 1.0 Universal | same | the receptionist / intake coordinator |
| `m_suit.glb` | Ultimate Modular Characters (men) — "Suit" | Quaternius | CC0 1.0 Universal | same, gray hair and muted suit for age diversity | the administrator / practice manager (inbox, coding queues) |

- pack pages: <https://quaternius.com/packs/ultimatemodularwomen.html>,
  <https://quaternius.com/packs/ultimatemodularcharacters.html>
- license: CC0 1.0 Universal (public domain dedication),
  <https://creativecommons.org/publicdomain/zero/1.0/> — confirmed both on the
  pack pages and in the packs' bundled `License.txt`
- animation clips kept: `Idle`, `Idle_Neutral`, `Interact`, `Walk`, `Wave`
- all character motion is driven from normalized scroll progress
  (`src/three/clinic/people/tracks.ts`); no free-running timelines

## fonts

| asset | source | license | used for |
| --- | --- | --- | --- |
| Geist Variable | `@fontsource-variable/geist` (npm) | SIL OFL 1.1 | all site typography, including canvas-drawn screens |

## build tooling (dev-only, not shipped)

`@gltf-transform/core` / `functions` / `extensions` and `meshoptimizer` are
devDependencies used solely by `scripts/characters/build.mjs`. the runtime
meshopt decoder ships inside `three` (`three/addons/libs/meshopt_decoder`).
