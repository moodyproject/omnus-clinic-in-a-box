# Character motion implementation checkpoint

Status: implementation and controller-authorized mobile overhead correction verified; ready for the existing publisher's technical preflight. No commit, push, merge or deploy performed.

Branch: `fix/clinic-character-motion`
HEAD / rollback: `fc184f29908f9d84fe4fb2813e8fb532c565759e`
Production preview: `http://127.0.0.1:4190/omnus-clinic-in-a-box/`
Preview listener PID: 87941 (npm parent87910). Prior dev4190 stopped. Old4173/4175/4180 servers untouched.
Publisher child: `t_ee5657df`, still dependency-gated.

## Restored behavior

- All six accepted humans now have skin-weighted head/neck/forearm gestures with distinct phases, driven only by tour progress.
- Patient walks from internal arrival to reception approach (.19-.27), pauses to interact (.27-.32), traverses actual consultation opening (.32-.40), plants feet and sits (.40-.43), remains seated for consultation/review (.43-.60), stands (.60-.63), then walks onward through the internal corridor (.63-.78).
- No old people subtree, body redesign or duplicate cast. Accepted principal anchors, shirt corrective, rooms, computer, walls, appliance geometry/materials and copy remain unchanged. Controller authorized an additional mobile-only sleeve lift for the demonstrated overhead occlusion; desktop and all camera paths remain unchanged.
- Runtime owns mixers and skeleton disposal, pauses with the existing canvas lifecycle, skips held-progress seeks, and avoids per-frame actor geometry rebuilds. Skinned mesh culling is disabled to avoid stale bind-bound disappearance.

Exact limits: the accepted shell has no exterior entrance opening; arrival/departure therefore stay within internal circulation. Reception interaction occurs at the clear approach, not a desk transaction. Other seated actors gesture from the accepted lap-rest pose, not full keyboard-contact typing. Gait is authored/procedural, not motion capture. No claim of full original choreography or physical-phone FPS.

## Exact runtime assets

| File under public/models/3d-redesign | Bytes | SHA-256 |
|---|---:|---|
| physician-seated.glb | 2609384 | 7adc4d3b1f0d8694efaae2da119ec6dd4b43a3a226e01feda6e5d736fef4b612 |
| patient-seated.glb | 2314748 | dfb74a9a83761be7828c3ec4a1e511be41ce427e60edb9b1b6370b2a3472aeb3 |
| room-people.glb | 6356872 | 60ccb4656e61402895beb7b56e8241b4201a54083384175db80a20dca8948617 |

Original asset/source baselines and new derivative hashes are separate in `docs/clinic-model-provenance.json`. All23 decoded named materials, PBR scalars, alpha policies and base/normal texture bytes equal the shipped baseline. Whole GLBs legitimately differ because skins/clips were added.

Editable derivatives and intermediate backups live in ignored `assets/clinic-motion/local/`. Recipes: `export_motion.py`, `patient_path.py`, `optimize.mjs`; geometry/clearance verifiers and manifest updater are adjacent. Reproduction requires the existing donor Blender and source directory supplied as an argument, plus the baseline GLBs extracted from the rollback commit into the local baseline folder. No tools, .blend files, caches or raw logs should be staged.

Runtime source diff: `src/three/clinic/{AcceptedClinic.tsx,acceptedModel.ts,acceptedMotion.ts}`, plus the controller-authorized mobile flag/clearance in `src/three/Experience.tsx` and `src/three/appliance/Appliance.tsx`. Additional intended files: `.gitignore`, provenance, this handoff, narrow plan, `assets/clinic-motion/*.{py,mjs}`, and `scripts/clinic-motion*.mjs`. No modifications to camera paths, content, forms or architecture sources.

## Real verification receipts

All final-asset motion/material/build checks were rerun after final texture preservation:

- `docs/evidence-motion-red.log`: all six actual articulated vertex deltas zero, patient travel zero, assertion failed on shipped static assets.
- `docs/evidence-motion-green.log`: six nonzero articulated vertex deltas at .47 versus .495; patient displacement .46156166993875986 website units between reception and consultation. The model scale is .1.
- `scripts/clinic-motion-validation.mjs`: exact reverse, held-progress and fresh-rig bone state; no stale-bound culling; shoe floor minima at22 progress samples. See `docs/evidence/clinic-motion/validation/determinism-contacts.json`.
- `scripts/clinic-motion-native.mjs`: actual native scrolling/reverse/reload at1440/390/375; zero reload scroll drift, bone errors below7e-10 after measured smoothing convergence. Failed fixed-wait375 receipt retained as `docs/evidence-motion-native-unsettled.log`; no tolerance relaxation.
- Blender `verify_bind.py`: every evaluated accepted source vertex preserved at the derivative seated skin bind within1e-5 meters, including shirt drape. Detailed results: `assets/clinic-motion/local/bind-appearance-verification.json`.
- Blender `verify_clearance.py`:22 patient/full-height-architecture-and-furniture BVH samples; no new intersections. Existing accepted chair-seat contact remains (140 triangle pairs at the seated baseline,28 near the end of descent); floors/rugs intentionally excluded from obstacle collision, shoe grounding checked separately. See `assets/clinic-motion/local/clearance.json`.
- `scripts/clinic-motion-materials.mjs`: exact23 material/texture identities PASS. Failed re-encoding receipt retained; optimizer restores original shipped texture bytes.
- `npm run lint`, `npm run typecheck`, `npm run build:pages`: PASS.
- `node scripts/clinic-integration-assets.mjs`: PASS. `node --experimental-strip-types scripts/clinic-integration-walls.mjs`: PASS, with Node's normal experimental-type-stripping warning.
- Actual staged production: `scripts/clinic-integration-journey.mjs` passed69 DOM/assets/scroll/history/navigation/CTA/focus/validation/resize checks across1440/390/375. IMPORTANT: its DOM-only pass does not establish the failed mobile overhead visual below.
- Production static/reduced/no-WebGL/context-loss modes: real static image, seven story scenes and working CTA; no animated GLB downloads for intentional static/reduced modes. Missing room-people asset fallback also passed.
- Production local font URL returns200 `font/woff2`. Dev-only source tests used reused dependency symlink and encountered Vite font allow-list403; production build copies fonts correctly, and final production journey screenshots/requests use those real fonts.

Renderer counters in the final native consultation samples: desktop185 calls/915096 triangles;390 at116/884408;375 at113/883844. These are renderer counters, not measured physical-phone FPS. Rendering all bounded skinned actors increases off-camera vertex work compared with bind-bound culling.

## Actual fixed-camera evidence

Paths are relative to this worktree; the left half of each MP4 is the actual shipped static GLB baseline, right half is the final animated cast. Cameras are fixed within each clip; website copy is hidden only in the diagnostic capture. These are encoded screenshot sequences of actual rendered frames, not camera movement or synthesized animation evidence.

- `docs/evidence/clinic-motion/fixed-camera-before-after-desktop.mp4`
- `docs/evidence/clinic-motion/fixed-camera-before-after-mobile390.mp4`
- `docs/evidence/clinic-motion/fixed-camera-before-after-contact-side.mp4`
- Additional unobstructed front-quarter sit frames: `docs/evidence/clinic-motion/final-film/contact-front/000.png` through `019.png`.
- Production website screenshots: `docs/evidence/clinic-motion/production-journey/`.

Bounded visual inspection found coherent walking/seated anatomy and no gross new furniture clipping. Exact sole contact is difficult to see against the pale floor, hence separate geometry/contact receipts; do not present screenshots as exhaustive intersection proof.

## Resolved baseline mobile issue (controller-authorized amendment)

Before the authorized correction, production390/375 overhead captures at p=.82 showed an opaque gray sheet instead of the clinic. The SAME issue was reproduced on the unchanged currently-live rollback site at390:

- `docs/evidence/clinic-motion/baseline-live-mobile-overhead.png`
- `docs/evidence/clinic-motion/motion-local-mobile-overhead.png`

Source diagnosis: the existing mobile camera rises through the hovering appliance sleeve during the overhead segment. Desktop stays below it during the overhead scene and shows the clinic. This was outside the original people-motion change and was amended explicitly by the controller.

Controller explicitly authorized one minimal mobile-overhead-only clearance correction in the same task. `Appliance` now adds a reversible1.3-unit sleeve lift only on mobile, eased in over .74-.79 and out over .89-.94. No geometry, material, camera-path, desktop behavior or actor changes. The focused rendered-pixel test first failed with zero clinic-colored pixels, then passed390/375 at .79/.82/.85/.87 and reverse, plus desktop overhead .82 sanity. Actual final375/390 screenshots were visually inspected: clinic/cast are now visible, no gray occlusion. Existing peripheral lateral cropping remains because the camera path is preserved; this is not a new whole-footprint camera redesign.

Final receipts: `docs/evidence-motion-overhead-red.log`, `docs/evidence-motion-overhead-green.log`, `docs/evidence/clinic-motion/overhead-green/results.json` and associated actual screenshots. Lint/typecheck/build:pages rerun after correction; final application bundle is `dist/assets/index-DyK7PyWG.js`. Motion/material evidence remains valid: those sources/assets did not change during this amendment.

An exploratory assertion at desktop .87 exposed its unchanged sleeve-crossing reveal transition. The final scoped check follows controller direction: preserve desktop, sanity-check its overhead at .82, test the adjacent/reverse mobile states being repaired. The exploratory receipt remains in `docs/evidence-motion-overhead-desktop-reveal.log`; no desktop reveal behavior was silently modified.
