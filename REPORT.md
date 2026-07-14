# omnus build report

date: 2026-07-13

## what was built

a complete, working marketing site for omnus around the "clinic in a box"
metaphor: a procedural three.js appliance in a warm product studio opens
along machined seams on scroll; the camera travels a miniature clinic inside
it (intake, exam, review, follow-through, operations overhead), then pulls
back out as the shell closes. eight scenes, one continuous object, native
scroll, both conversion paths implemented, mobile keeps the full narrative
on its own camera path, and reduced-motion / non-webgl visitors get the same
story as accessible steps.

## verification results

- `npm run lint`: clean, no errors or warnings.
- `npm run typecheck` (tsc project references): clean.
- `npm run build`: clean production build (`dist/`), no chunk warnings.
  three.js is split into its own cached chunk (~318 kb gzip); app code is
  ~30 kb gzip plus fonts.
- production build served via `npm run preview` and screenshotted at
  1440x900 and true 375x812 (2x): see `screenshots/01..14`. all captures in
  this folder are from the production build.
- forms exercised end-to-end in the browser. demo dialog (dev build, no
  endpoint): empty submit shows four required-field errors, invalid email
  is caught, pending state disables the submit button, success shows with
  an explicit "local test mode: nothing was sent" chip, escape closes, and
  tab/shift-tab wrap inside the dialog (focus trap verified). waitlist
  dialog (production build, no endpoint): opens, validates, and correctly
  refuses to fake success, showing the honest "not connected to a
  submission endpoint yet" message.
- static fallback (`?static=1`, also used for prefers-reduced-motion and
  non-webgl) captured and reviewed: full copy in order, css device
  illustration, working ctas.
- mid-page reload and deep links (`?p=`, `?pose=`) snap the camera instead
  of replaying, verified via the pose captures.
- scroll reversibility is by construction: every 3d and dom state is a pure
  function of normalized progress (instanced transforms included), and the
  copy timeline is a scrubbed gsap timeline, so forward and reverse
  scrolling produce identical states. smoothing is frame-rate independent
  damping with a clamped dt.

## visual review scores (after revisions)

| axis                   | score /10 |
| ---------------------- | --------- |
| product realism        | 7.5       |
| transformation clarity | 7.5       |
| architectural coherence| 8         |
| typography             | 8.5       |
| composition            | 7.5       |
| lighting               | 7         |
| mobile readability     | 8.5       |
| brand restraint        | 9         |

## the three weakest decisions found in review, and what was done

1. the first appliance render read as a generic black pc tower: flat
   lighting, two disconnected vent rectangles, text overlapping the device.
   fixed with a procedural white-cyc environment (lightformers + enclosure),
   anodized material response, vent fields that butt the center seam so the
   front reads as one machined face, and a recomposed hero camera that keeps
   the device right of frame.
2. the first interior cameras flew at miniature eye level, so partitions and
   ceiling infrastructure filled the frame and rooms were unreadable. the
   interior was re-choreographed as "leaning over an architectural model"
   views, the ceiling information tracks were removed entirely (the sage
   floor routes already carry that language), the core column became a slim
   ceramic instrument instead of a graphite monolith, and the compute deck
   moved higher with an aluminum finish.
3. copy was illegible whenever the camera faced dark geometry. interior
   scenes now carry a quiet porcelain scrim card (hero and finale stay
   bare), which also gives the mid-journey scenes a consistent editorial
   rhythm.

## honest remaining limitations

- the appliance and clinic are fully procedural. that was the brief's
  starting point, but a sculpted glb (with normal-mapped seams, fillets,
  and imperfections) would raise product realism another step; the asset
  seam for that swap is documented in the readme.
- lighting is deliberately cheap (no baked gi, no postprocessing). interior
  shadowing relies on geometry and material contrast rather than occlusion,
  so some interior shots read flatter than a raytraced product film would.
- the "during the visit" wave-to-transcript morph is legible in motion but
  its wave stage reads abstract in stills; a beat more dwell time or a
  transcript "typing" texture on the wall display would strengthen it.
- true high-velocity scroll input could not be exercised in this sandboxed
  browser (its compositor throttles hidden tabs; that is also why
  `preserveDrawingBuffer` is enabled and why the `?pose=` qa mode exists).
  reversibility and mid-page restore were verified through the progress
  architecture and pose captures instead.
- form submissions have no backend here by design; the ui is honest about
  local test mode and unconfigured production endpoints (both modes were
  exercised, see verification above).

## deliverables

- source: this repository (`src/`), lint- and typecheck-clean
- production build: `dist/` (`npm run preview` to serve)
- `.env.example` documenting both form endpoints and payloads
- `README.md` covering setup, architecture, content edits, forms, glb
  replacement, accessibility, deployment
- `screenshots/01..14`: hero, opening seam, entering, all four rooms,
  overhead operations, closing, final reveal, mobile hero/exam/overhead,
  and the static fallback, all captured from the production build
- `scripts/capture.mjs`: reproducible screenshot rig
