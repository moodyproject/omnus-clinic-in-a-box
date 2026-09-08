# Accepted clinic motion repair

Goal: restore articulated scroll-driven motion on the accepted six humans, including patient arrival, consultation sit and departure; preserve all other scene/content.
Architecture: reuse existing donor rigs, bake evaluated accepted seated surfaces (including corrected shirt) as skin bind geometry, retain interpolated original weights and bind the existing skeleton to the accepted seated pose. Export one deterministic narrative clip per asset. Runtime owns mixers, seeks pure progress, and disposes rigs. No anatomy regeneration, new dependencies, commits or publication.

1. RED: scripts/clinic-motion.mjs samples actual runtime vertices and patient world movement at fixed camera/progress; preserve static baseline frames and failed receipt.
2. Inspect original Blender rig/deform layers. Author assets/clinic-motion/export_motion.py; first export a small seated head/arm clip and prove real deformation/anchor agreement promptly. If original rigs cannot support faithful motion, checkpoint concrete blocker within 30 minutes.
3. Extend that same patient rig with grounded walk/sit choreography through measured accepted openings. Keep other five seated, lower body planted, distinct head/arm interaction phases. Max two material pose corrections.
4. Integrate narrowly in acceptedModel.ts and AcceptedClinic.tsx. Verify deterministic forward/reverse/hold/reload, clip deformation and patient travel; preserve appearance against baseline.
5. Run lint, typecheck, build:pages, focused asset/wall/failure/interaction checks and desktop 1440/mobile 390/375 journey checks on owned port4190. Capture fixed-camera motion sequences. Update actual provenance/hashes; keep large editable sources local/ignored.
6. Inspect existing publisher child, finish only on verified acceptance with exact diff/head, receipts, artifact path, runtime PID/URL, limits and rollback fc184f2. Otherwise report concrete blocker, do not release publisher.

Controller amendment: fix demonstrated pre-existing mobile overhead sleeve occlusion only. Keep camera paths/desktop and all accepted geometry/materials unchanged; one reversible mobile-only sleeve-clearance adjustment. Actual375/390 pixel RED/GREEN plus adjacent/reverse and desktop .82 sanity; no new review graph.
