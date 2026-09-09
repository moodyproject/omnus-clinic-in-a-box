# Mobile framing and readable motion implementation plan

Goal: Center phone clinic/actions and make all six people visibly articulate without changing accepted assets, patient travel, desktop framing or recovery policy.

Architecture: CameraRig remains the only camera writer. Mobile composition uses actual action centers and a horizontal field of view independent of portrait aspect; project the action into the unobscured viewport above story copy. acceptedMotion owns deterministic scroll-seek gestures, using actor-scoped authored bone identity and animation-only quaternion bases to avoid cumulative overlays.

1. RED: capture live Chromium/WebKit375/390/430 native phone stages with scripts/clinic-mobile-framing.mjs. Inspect screenshots, retain labeled sequences. Same-camera actor pair probe must distinguish actual silhouette change from camera motion.
2. Camera vertical slice: correct src/three/paths.ts mobile room targets, dynamically fit the overview's physical footprint in src/three/CameraRig.tsx. Keep desktop keys untouched. First390 before/after artifact before a broad matrix.
3. Motion vertical slice: same-camera named actor frame pairs from real scene; capture RED, add bounded stage-timed spine/head/forearm/hand gestures in src/three/clinic/acceptedMotion.ts. Patient clip untouched. Cache animation-only transforms, no clocks or autoplay. Derive visible-pixel movement gates from inspected phone frames, not bone epsilons.
4. Verify: phone both engines375/390/430 forward/reverse/resize, desktop1440; reduced opt-in and asset-failure low-quality retry; actor pairs/grounding; sealed five GLB hashes; existing motion/native/wall/form regressions. npm run lint, typecheck, build, build:pages. Keep known history/reload caveat.
5. Handoff: docs/mobile-framing-motion-handoff.md, exact evidence and limitations/rollback. Stop owned servers. No commit/push/new tasks; complete only after gates to release existing publisher.

## Contained coordinator correction (t_627b89df)

Publisher's preserved seven-frame native sequences are the visual RED: left hand hidden by torso/chair, not absent animation. Ranked causes: rear camera occlusion (confirmed native strip); monitor occlusion from a front angle (candidate inspection must exclude); inadequate gesture amplitude (only consider after exposing the hand). Change only the two mobile follow camera positions first, borrowing the successful review front-oblique sightline. Reuse publisher sequence in a separate correction directory; inspect Chromium390 before further testing. Then WebKit375 and focused430 retry, unchanged room/overview smoke, required build/hash checks. No animation edit unless the exposed silhouette still fails. Correct the patient row label without replacing historical failure evidence. Update the same handoff, stop owned servers, release existing publisher without commit/push.
