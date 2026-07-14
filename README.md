# omnus

marketing site for omnus, the clinic operating system for independent physicians.

live concept: https://moodyproject.github.io/omnus-clinic-in-a-box/

the site is one continuous spatial journey: a machined omnus appliance opens
along its seams and the camera travels through a miniature clinic living
inside it, following the physician workflow, before the shell closes again.
"clinic in a box" is the product story and the page structure at once.

## stack

- react 19 + typescript + vite
- three.js + @react-three/fiber (+ a little @react-three/drei)
- gsap ScrollTrigger for scroll progress and dom copy choreography
- plain, disciplined css (no tailwind, no ui kit)
- self-hosted geist variable via @fontsource-variable/geist

no cms, no analytics, no external scripts, no runtime cdn assets.

## setup

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build on http://localhost:4174
npm run lint       # eslint
npm run typecheck  # tsc project references
```

## architecture

the scroll journey is a tall section (`~8 viewport heights`) with a sticky,
pinned canvas. one ScrollTrigger writes normalized progress `p in [0, 1]`
into `journeyState` (src/scroll/journey.ts). everything derives from `p`:

- `src/three/CameraRig.tsx` smooths `p`, samples the keyframed camera path
  in `src/three/paths.ts` (separate desktop and mobile paths), and damps the
  camera toward it. gsap never touches the three.js scene graph.
- `src/three/appliance/Appliance.tsx` lifts and settles the sleeve as a pure
  function of `p` (`shellOpen`, `capLift`). the chassis base doubles as the
  clinic's floor slab, so the hardware literally becomes the building.
- each room in `src/three/clinic/` maps `p` to its own scene-local progress
  (`sceneT`) and interpolates its choreography (papers resolving, the audio
  wave becoming transcript segments and then structured clusters, fragments
  arriving on the soap desk, the plan block travelling to the four
  follow-through stations, admin documents resolving into queues).
- `src/ui/JourneyCopy.tsx` renders the eight copy blocks and scrubs their
  visibility on the same progress windows (`SCENES` in src/scroll/journey.ts).

because every visual state is a pure function of `p` (plus a little ambient
time-based motion), scrolling is fully reversible and survives fast
scrubbing and mid-page reloads (`journeyState.snap` makes the camera jump
rather than animate after a restore).

key directories:

```
src/content/copy.ts        every word of marketing copy, typed
src/scroll/                journey timeline, pinned section, progress store
src/three/                 studio, appliance, camera, materials, textures
src/three/clinic/          the miniature clinic: rooms, routes, props
src/ui/                    nav, copy overlay, conversion, footer, fallback
src/ui/forms/              modal, demo + waitlist forms, submission logic
scripts/capture.mjs        screenshot rig for the states in screenshots/
```

## changing the copy

edit `src/content/copy.ts`. scene copy, nav labels, form labels, error
strings, and the footer all live there. scene timing lives in
`src/scroll/journey.ts` (`SCENES`).

## form endpoints

both forms POST json to same-origin endpoints configured at build time:

```
VITE_DEMO_ENDPOINT=/api/demo
VITE_WAITLIST_ENDPOINT=/api/waitlist
```

see `.env.example` for payload shapes. behavior is explicit about state:

- endpoint configured: real fetch, success and error states, 10s timeout.
- no endpoint, dev build: "local test mode" runs the whole ui flow and
  clearly labels that nothing was sent.
- no endpoint, production build: the form says submissions aren't wired up
  yet instead of pretending to succeed.

form contents are never logged.

## replacing procedural geometry with glb assets

the appliance and the clinic are procedural on purpose (no dcc tool in the
loop, fully reproducible). both sit behind clean component seams:

- `src/three/appliance/Appliance.tsx` exposes the whole device as one
  component whose only inputs are `quality` and the shared progress store.
  a future `omnus-appliance.glb` can replace the internals of that file:
  keep the chassis base and the one-piece sleeve as separately named nodes
  so the lift choreography (`shellOpen`, `capLift`) can keep driving them.
- each room in `src/three/clinic/` is a self-contained component using the
  shared material set (`src/three/materials.ts`). swap any room's props for
  imported meshes without touching the journey, camera, or copy.

if you generate glbs, keep the procedural versions as the fallback and gate
the loader behind `useGLTF` + suspense per room.

## accessibility

- semantic dom copy with a real h1 and ordered h2s; the canvas is
  aria-hidden and purely decorative.
- keyboard: real buttons everywhere, visible sage focus states, a
  skip-to-content link, and a persistent "skip the tour" control that jumps
  past the cinematic sequence.
- forms: labelled fields, inline errors with aria-describedby, focus trap,
  escape to close, focus restoration.
- prefers-reduced-motion: the journey is replaced by a stepped, fully
  static version of the same story (`src/ui/StaticJourney.tsx`).
- no webgl: same stepped fallback with a css illustration of the device.
  force it with `?static=1`.

## qa helpers

- `?pose=0.45` freezes the journey at any progress without scrolling
  (used by the screenshot rig; headless browsers don't capture scrolled
  viewports).
- `?p=0.45` scrolls to a progress position on load.
- `node scripts/capture.mjs http://localhost:4174` regenerates
  `screenshots/` using the locally installed chrome.

## deployment

`npm run build` emits a fully static `dist/`. serve it from any static
host. if you use the forms, terminate `VITE_DEMO_ENDPOINT` and
`VITE_WAITLIST_ENDPOINT` on the same origin (a reverse-proxied route in
front of the static files) and set the env vars at build time.

`preserveDrawingBuffer` is enabled on the canvas so background tabs and
screenshot tooling always composite a rendered frame; if you never need
that, it can be turned off in `src/three/Experience.tsx` for a small
performance win on some gpus.
