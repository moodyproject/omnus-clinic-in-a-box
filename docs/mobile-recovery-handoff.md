# Mobile clinic recovery handoff

## Result and release boundary

Implementation task `t_1dfd07f6`, branch `fix/clinic-mobile-recovery`, workspace `/Users/moud/coding/.worktrees/omnus-clinic-mobile-recovery`.
Working local source and normal Pages build are ready for the existing publisher `t_51600dec`. Builder did not commit, push, deploy, or change another worktree. Publisher must wait for builder PID 99473 to exit before writing.

Preserved all five sealed GLBs, six accepted humans, articulated scroll animation, patient travel, furnished rooms, wall cutaway, appliance, overhead camera repair, website copy, navigation and forms. No runtime dependencies added. Only manual recovery reduces quality: DPR 1, low tier, no shadows. Normal mobile quality/default 3D is unchanged.

## Reproduction and confidence

High-confidence reproduced defects, in real browser processes with mobile/touch contexts:

- Reduced-motion preference and `?static=1` displayed the saved clinic with no explicit 3D entry. Forced static was incorrectly described as reduced motion.
- Injected model download failure and actual `WEBGL_lose_context` left visitors in static mode with only reload instructions and no retained failure stage.
- With WebGL2 unavailable but WebGL1 still allowed, the old probe returned true, then Three r182 failed to create its renderer. No static fallback appeared within 30 seconds. Both engines emitted renderer creation errors.
- Separately, a successful detached capability probe followed by a failed connected renderer context also escaped the outer React boundary. R3F configures asynchronously. Reporting `renderer-init` at the renderer factory now restores the complete fallback in this path.

The exact cause on Moud's physical phone is NOT known. These reproduce possible failure paths and the fallback dead end, not a diagnosis of his device setting, iOS version, Telegram browser, memory pressure or network. Both engines rendered normally here before and after repair.

Resource receipt: five GLBs total 12,896,808 bytes; at consultation, 375/390 render 113/116 calls and 883,844/884,408 triangles, 77 renderer textures. Unique clinic texture objects account for 30,146,560 image texels. These are browser counters, not measured physical-device GPU residency or proof of memory exhaustion. Asset provenance hashes pass. No speculative asset/quality redesign was made.

## Changed surfaces

- `src/App.tsx`: explicit per-page choice; capability recheck; typed failure stage; two manual recovery attempts; DPR-1 retry; static return.
- `src/hooks/useMediaFlags.ts`: WebGL2-only probe matching Three; release temporary probe context.
- `src/lib/sceneFailure.ts`: bounded local stage names and actionable messages, no URLs/PII/error payloads/telemetry.
- `src/three/Experience.tsx`: renderer-init, scene-render and context-lost reporting.
- `src/three/clinic/AcceptedClinic.tsx`: asset-load versus asset-timeout reporting; original disposal/cancellation preserved.
- `src/scroll/JourneySection.tsx`: callback type only.
- `src/ui/StaticJourney.tsx`, `src/styles/journey.css`: warning, recovery controls and diagnostic text; full seven story sections and contact/forms retained.
- Two bounded browser scripts, implementation plan, this handoff, and ignore entry for evidence.

## Interaction contract / selectors

- `[data-action="enable-3d"]`: "Enable interactive 3D" from reduced/explicit static. Warns that motion follows scrolling. Clears only `static` query parameter, does not persist an accessibility override. Reload re-honors reduced-motion preference.
- `[data-action="view-static"]`: visible "View without motion" control while 3D is active.
- `[data-action="retry-3d"]`: manual lower-quality retry, or "Check again for 3D" when WebGL2 unavailable. At most two attempts per page; never mounts a Canvas when the new probe fails; no auto-retry.
- `[data-scene-reason]`, `[data-scene-diagnostic]`: local reason/attempts only. Reasons: `reduced-motion`, `explicit-static`, `no-webgl2`, `renderer-init`, `scene-render`, `asset-load`, `asset-timeout`, `context-lost`.
- After exhaustion the full story and forms remain, and the message suggests checking connection/reopening in standalone Safari or Chrome. Repeated failure never erases the page.

## Verification receipts

All evidence is ignored under `docs/evidence/mobile-recovery/`; do not commit generated screenshots, JSON/log bulk or `dist`. Programmatic aggregation: `node docs/evidence/mobile-recovery/summarize.mjs`; output `summary.json`, deduplicated `motion-combined.json`.

Engines: installed Google Chrome 152.0.7977.83 and Playwright WebKit 26.5 on macOS. Playwright is resolved through `/Users/moud/.hermes/hermes-agent/package.json` (override with `PLAYWRIGHT_PACKAGE` pointing at a package.json beside an installed Playwright). `sharp` resolves through the existing project/ancestor toolchain as with the prior overhead test. The shell `playwright` installer targeted a different WebKit revision; it was stopped within the bounded attempt. The already installed module's WebKit successfully ran every stated WebKit case. No physical iOS or Telegram acceptance is claimed.

Commands and exact result summaries:

1. `node scripts/clinic-mobile-recovery.mjs` before edits: baseline 12 rows, 2 normal passes / 10 expected RED failures. `baseline/results.json`.
2. `PHASE=preference-green MODES=reduced,static node scripts/clinic-mobile-recovery.mjs`: 4/4 GREEN.
3. `PHASE=renderer-red MODES=renderer node scripts/clinic-mobile-recovery.mjs`: 2/2 RED (30-second fallback timeouts). After factory change, `PHASE=renderer-green MODES=renderer ...`: 2/2 GREEN.
4. `PHASE=matrix-green node scripts/clinic-mobile-recovery.mjs`: 20/20 GREEN. Normal, reduced then opt-in, forced static, failed asset then retry, persistent no-WebGL2, actual context loss then retry, renderer failure then retry, exhausted persistent load failures, restored capability, timeout then retry. Each engine. Stage assertions, zero initial GLBs for preference/capability static, no capability bypass, DPR-1 recovery, static return, seven sections/contact, demo open/Escape and overflow checks.
5. `npm run build` and `npm run build:pages`: exit 0; Vite 6.4.3, 628 modules transformed. Normal Pages preview: `npm run preview -- --host 127.0.0.1 --port 4197 --strictPort --base=/omnus-clinic-in-a-box/`.
6. `BASE_URL=http://127.0.0.1:4197/omnus-clinic-in-a-box/ PRODUCTION=1 PHASE=production-green node scripts/clinic-mobile-recovery.mjs`: 20/20 GREEN against normal production artifacts. No pose or diagnostic build flags. Production readiness asserts all five real GLB responses and visible Canvas/no fallback; actual bone/vertex inspection is separately performed in development, not falsely attributed to production introspection.
7. `node scripts/clinic-integration-journey.mjs http://127.0.0.1:4197/omnus-clinic-in-a-box/ docs/evidence/mobile-recovery/journey`: 69/69 PASS. 1440, 390, 375 native scenes, forward/reverse, reload/history, nav/skip/resize, demo focus trap/validation/Escape, waitlist; zero network failures/page exceptions. `journey/results.json`, `journey.log`.
8. `node scripts/clinic-motion-native.mjs http://127.0.0.1:4196/`: 1440/390/375 PASS; reload scroll delta 0 each, reverse/reload bone error below 0.0001, zero exceptions. Receipt remains `docs/evidence/clinic-motion/native/results.json`, also copied into aggregate summary.
9. `node scripts/clinic-motion-validation.mjs http://127.0.0.1:4196/`: reverseErrors 0, holdError 0, freshError 0; foot contacts and skinned culling assertions PASS. Receipt `docs/evidence/clinic-motion/validation/determinism-contacts.json`, included in aggregate.
10. `node scripts/clinic-motion-overhead.mjs http://127.0.0.1:4196/ docs/evidence/mobile-recovery/overhead`: 13 overhead pixel assertions PASS including 375/390 forward/reverse.
11. `node scripts/clinic-mobile-motion.mjs`: first four engine/width rows PASS, then foreground 180-second tool cap interrupted the remaining two, not a product failure. Completed ONLY missing rows with `ENGINES=webkit WIDTHS=390,1440 MOTION_OUT=docs/evidence/mobile-recovery/motion-webkit-rest node scripts/clinic-mobile-motion.mjs` (exit 0). Combined exact coverage: both engines × 375/390/1440, 6/6 PASS. All six actual bone arrays articulate, sampled skinned patient geometry travels at least 0.46156009571884743 scene units, max reverse bone error 3.830892270073605e-10; minimum overhead chromatic pixels 8649 (threshold 1000); no page errors. Allow ~300 seconds for an unsplit whole run on this host.
12. `node scripts/clinic-integration-assets.mjs`: "PASS five sealed accepted GLBs, four new named occupants, architecture metadata, provenance hashes".
13. `node --experimental-strip-types scripts/clinic-integration-walls.mjs`: "PASS translated/scaled closed-half-open-reverse wall plane, fixtures, exact restoration and disposal". Plain Node22 invocation first failed to load TS; corrected flag, no source change.
14. `git diff --check`, `npm run lint`, `npm run typecheck`: exit 0. No runtime package/lock change.

Normal, preference, capability and context-loss runs have no browser errors. Injected failed assets intentionally produce request errors. Injected renderer failure still emits Three's error and R3F's asynchronous rejected promise, but now the stage-aware fallback appears and manual recovery succeeds. These diagnostic errors are retained, not silently suppressed or represented as normal browsing failures. `scene-render` is typed/reported by the existing React boundary but is not an independently injected frame-loop exception test.

Harness corrections, not product changes: initial travel check sampled the immutable GLB wrapper; corrected to actual skinned world vertices. Initial reverse check sampled unsettled smoothing; corrected to wait for native progress convergence and tightened the assertion. Failed probes retained in `motion-wrapper-probe-failed.log` and `motion-unsettled-probe-failed.log`. Independent read-only reviewer found a launch-gap false-success in the test script; it now fails missing engines and asserts requested row count. No concrete product/security bug reported by that review.

## Before/after diagnostic images

- Before dead end: `docs/evidence/mobile-recovery/baseline/webkit-reduced-before.png`.
- After visible warning/opt-in: `docs/evidence/mobile-recovery/matrix-green/webkit-reduced-before.png`.
- After actual opt-in: `docs/evidence/mobile-recovery/matrix-green/webkit-reduced-after.png`.
- Failure and recovery: `docs/evidence/mobile-recovery/production-green/webkit-asset-before.png` / `webkit-asset-after.png`.
- Actual six-person overhead: `docs/evidence/mobile-recovery/motion-webkit-rest/webkit-390-overhead-0.82.png`.

Diagnostic image inspection confirms visible unclipped opt-in and static-return controls, and the multi-room furnished six-person clinic rather than the previous gray-panel obstruction. Not a redesign or new aesthetic acceptance gate.

## Publisher contract

Build/deploy normal `npm run build:pages` using the existing workflow to the SAME URL:
`https://moodyproject.github.io/omnus-clinic-in-a-box/`

No `?pose`, `?p`, forced `?static`, diagnostic bundle or autoplay/accessibility override for the default release. Public `?static=1` may be exercised as a separate explicit-static test only. Verify actual deployed SHA/bundle, Pages success, all five GLBs, public normal/opt-in/retry paths, motion and forms. Do not claim Moud's physical phone is verified. Actionable user instruction if saved view persists: tap "Enable interactive 3D" or the displayed retry/check button; use standalone Safari/Chrome if an in-app browser cannot provide WebGL2.

Rollback source: `29abb80561fa85ffb4e02b6affeaa38dd3e93313`. Publisher owns a focused normal commit/push; no force push or changes to donor/main/motion worktrees. Evidence is local and intentionally excluded from commit. Owned local preview/dev processes are stopped before completion; publisher restarts its own verification servers.
