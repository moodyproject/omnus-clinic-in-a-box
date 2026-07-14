# humanization pass — build report

date: 2026-07-14. continuation from `62de1c2` ("feat: redesign appliance and
clinic for visual credibility"). this pass replaces the abstract sage routing
language with a small cast of miniature people, rebuilds the operations
choreography, and fixes the three priority mobile defects. the architecture
(normalized scroll progress, deterministic scrubbing, procedural geometry,
fallbacks, pages deployment) is preserved.

## what changed

### people instead of routes
- removed `InfoPath` floor routes, the exam room's floating sage blocks, the
  review room's flying fragments and sage exit gate, the reception "patient
  thread", and the traveling plan block — the sage vines are gone.
- sage remains only as status indicators (appliance led, core status ring,
  screen accents) and one staff clothing accent.
- added five CC0 rigged characters (see `ASSETS.md`): a patient, a
  receptionist, a physician, a care coordinator, and an administrator.
  every position, facing, seated factor, and animation-clip time derives from
  normalized scroll progress (`src/three/clinic/people/tracks.ts`), so
  scrubbing backward replays identical states (verified numerically to 3e-7).
- walk-clip time is distance-parameterized (no foot skating); seated legs are
  solved with a per-leg two-bone ik so all rigs sit believably on chairs.
- characters lazy-load ~0.9s after the hero paints or on first scroll;
  the closed-appliance hero never waits on them.

### scenes
- exam room: the wall display now carries the story — live video, then
  transcript rows, then structured extraction chips, crossfaded by scroll.
- review: soap regions + approval bar remain the one sage confirmation;
  the physician sits at the desk and approves; the room stays paused-clean.
- follow-through: referral paperwork physically collates into the out-tray
  and instruction stacks while the coordinator works the room.
- operations: rebuilt around people. four task queues (scheduling rack,
  inbox nook, coding and reports consoles) begin in restrained disorder and
  settle into flush stacks; the inbox screen calms; all five people work
  simultaneously and two of them walk between stations. queues exist only
  inside the ops scene window, so earlier scenes stay clean.

### mobile
- ops copy: near-solid bottom scrim (99→97→88% soft-white), tightened type
  rhythm; heading and body fully inside the 375x812 viewport.
- navigation: one header row — wordmark, "skip the tour" as an underlined
  44px text action, "book a demo" pill. no stacked controls.
- hero: closer, lower camera; the appliance fills the frame with its status
  display readable; copy block tightened; product-launch composition.
- overhead camera raised so the full plan fits 375px width at scene end.

### clinic + hardware polish
- warmer floors and rugs, oak reception surfaces, lifted wall-cap tone,
  contact shadows under chairs/consoles, corridor vent fins removed as noise.
- intake/exam cameras reframed so the check-in and the physician-patient
  conversation read without wall occlusion; ops camera shifted so the west
  stations clear the copy column.
- appliance: brighter status display, top-chamfer catch-light edges, a
  panel-gap reveal at the sleeve base. no redesign.

## verification (all pass)
eslint, typecheck, `build`, `build:pages`, direct `?pose=` loads, static
fallback, reduced motion, both forms (focus trap, escape, empty-submit
validation, local-mode notice), no console errors, no horizontal overflow at
375/390/430, hero-before-characters loading order, 5/5 glbs lazy-loaded,
character determinism (max delta 3.4e-7 across approaches from both scroll
directions), 12 rapid direction reversals clean.

## performance (production build)
- js total 1.36 MB raw / 397 KB gzip (three chunk 318.6 KB gz, app 60.3 KB gz,
  vendor 27.7 KB gz); css 4.5 KB gz; fonts 74.6 KB.
- hero payload ≈ 476 KB compressed; characters are not part of it.
- character payload: 5 glbs, 1.12 MB raw / 658 KB wire, largest 251 KB
  (meshopt-compressed, finger tracks stripped, 5 clips kept, no textures).
- 60 fps observed at exam and ops scenes at 1440x900 and 375x812 (headless
  chrome on apple silicon); zero long tasks recorded, including during
  character parse.

## screenshots
- `screenshots-baseline-62de1c2/` — fresh baseline captured from the
  unmodified commit before any edit.
- `screenshots/` — final matrix: 11 journey states × 5 viewports (1440x900,
  1280x800, 375x812, 390x844, 430x932) plus static fallback, reduced motion,
  demo/waitlist modals, and an increased-text-size check.
- rig: `scripts/capture.mjs` (full matrix), `scripts/shot.mjs` (one-offs),
  `scripts/verify.mjs` (functional + determinism suite),
  `scripts/probe.mjs` (live scene introspection, dev only).

## known limitations
- the cast is stylized (quaternius, cc0). they read as architectural-model
  figures at the intended camera distances; true archviz-grade sculpted
  humans would need custom character production.
- seated poses are ik-solved approximations tuned for the miniature scale;
  extreme zoom (not reachable by the journey cameras) would show simplified
  hands and faces by design.
