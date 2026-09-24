# interior visual-quality pass — build report

date: 2026-07-15. continuation from `ac12884` ("fix(clinic): unify
architecture and constrain object motion"). this pass turns the procedural
clinic into a furnished, warmly lit miniature architectural visualization:
every room now has a recognizable purpose, materials separate cleanly, doors
read as intentional openings, and the operations corridor is structured by
shared built-in consoles. no experience redesign: the narrative order,
appliance, cast, scroll architecture, fallbacks, and deployment are untouched.

## what changed

### furniture and rooms (`src/three/clinic/props.tsx` + room files)
- rebuilt the furniture kit: upholstered task chairs and side chairs (sage /
  clay / warm gray pads on satin graphite frames), a physician stool, a
  built-in reception desk with transaction ledge and modesty panel, desks
  with drawer pedestals, an upholstered exam table with paper roll, pillow,
  piping and step, sink counters with recessed basin + gooseneck faucet,
  tall supply columns, wall cabinets with steel pulls, wood-and-graphite
  shelving, letter trays, a printer, wall-mounted glove/sanitizer supplies,
  a diagnostic instrument panel, a vitals station, waste bins, coat rails,
  a water station, potted plants, framed prints, acoustic wall panels, and
  engraved wall signs. everything is procedural; no external assets added.
- reception: waiting area on a woven rug (three spaced chairs, side table,
  acoustic panel, plant), built-in desk facing the door, check-in kiosk
  beside the door, staff counter with intake trays and water along the
  front wall, schedule rail, coats.
- exam: patient chair + physician stool at the consult spot, oak physician
  station, exam table with instrument panel, sink run with upper cabinets
  and supplies, tall storage, vitals station by the door, waste bin. the
  staged wall display (live visit → transcript → extraction) now hangs on
  a visible steel mount.
- physician review: oak desk with dark soap inlays (light engraved labels)
  and the approval bar, aligned task chair, reference shelf, closed cabinet,
  task lamp, document trays, acoustic panel, art.
- follow-through: one continuous built-in coordination counter with a
  status monitor, labeled scheduling / referrals / instructions zones,
  collated trays, printer, upper cabinets; wall-mounted referral out-rack
  and follow-up queue board; closed storage flanking the door.
- operations: the warehouse rack and loose island desks are gone. four
  built-in consoles share one cabinetry language: scheduling (west end),
  clinic inbox (east end, staged queue that calms), coding · billing and
  follow-up (backed against the corridor walls beside the core). each has
  a counter, an angled screen, an engraved label, and flush task stacks.

### architecture, doors, corridor (`src/three/clinic/Clinic.tsx`)
- every doorway is now a full assembly: deeper jambs and lintel, steel
  threshold strip, hinge barrels, and a pale-wood leaf with handle and kick
  plate parked open flat against the room-side partition (hinged nearest the
  cross corridor, consistent swing logic). no more loose angled slabs.
- corridor floor is a terrazzo inlay with graphite edge hairlines; the core
  sits on a graphite plinth inside an engraved service ring; the entrance
  keeps its threshold plate; a small bench sits outside reception.
- the core reads as an instrument: plinth, machined reveals, graphite crown,
  recessed front status slot, sage status rings.
- corridor floor labels were replaced by engraved console labels and wall
  signs (reception / exam / review / follow-through) on the corridor faces.

### materials (`src/three/materials.ts`, `src/three/textures.ts`)
- new separated families: warm off-white walls, terrazzo corridor (tiling
  speckle texture), warm resilient floors in patient rooms, quiet mineral
  floors in work rooms, woven rug texture, ivory cabinetry, light mineral
  counters, oak worktops, pale-wood door leaves, satin graphite frames,
  brushed stainless fixtures, and three upholstery tones. screens stay deep
  graphite with sage interface states. nothing is uniformly beige or white.

### lighting and depth
- interior walls no longer cast directional shadows (the hard diagonal
  wedges are gone); depth now comes from a floor ambient-occlusion vignette
  in every room + corridor, contact shadows under all furniture and people,
  and three quiet interior point lights (warm key over the front rooms,
  cool fill over the back, a warm front kicker) that fade with the sleeve.
  no bloom, fog, or postprocessing added; mobile performance unchanged.

### people
- seated pose corrected (deeper body drop, feet closer to the body): hips
  now land on seat pads on every rig; chairs and stools were re-placed to
  the exact tracked hip positions, so nobody floats or straddles furniture.
- the administrator's operations stop moved onto the coding · billing
  console with a look target, so his lean reads as working at the counter
  from the overhead camera instead of collapsing in open corridor space.
- only humans animate inside the revealed clinic; screens change interface
  state only; determinism verified numerically (fwd vs reverse approach).

### copy presentation (`src/styles/journey.css`)
- desktop scrims: columns narrowed (27vw / 372px max), edge gradients peak
  lower (93%) and feather sooner (transparent by ~68%), less vertical
  padding — noticeably more architecture visible beside every copy block.
- mobile: bottom scrim tightened (shorter feather, less top padding) so the
  scene keeps more of the frame while copy stays fully readable.

## verification (all pass)
eslint, typecheck, `build`, `build:pages`, direct `?pose=` loads, static
fallback, reduced motion, both forms (focus trap, escape, empty-submit
validation), no console errors, no horizontal overflow at 375/390/430,
hero-before-characters loading order, 5/5 glbs lazy-loaded, character
determinism (max delta 1.6e-6 across approaches from both scroll
directions), camera convergence, 12 rapid direction reversals clean.

## performance (production build)
- js total ≈ 1.41 MB raw / 410 KB gzip (three chunk 318.6 KB gz, app
  63.6 KB gz, vendor 27.7 KB gz); css 4.7 KB gz; fonts unchanged.
- the furnishing pass costs ≈ +3.4 KB gzipped js and zero new network
  requests: all new furniture is procedural geometry and canvas textures.
- hero payload unchanged; characters still lazy-load after the hero.

## screenshots
- `screenshots-baseline-ac12884/` — fresh baseline captured from the
  unmodified commit before any edit.
- `screenshots/` — final matrix: 11 journey states × 5 viewports (1440x900,
  1280x800, 375x812, 390x844, 430x932) plus static fallback, reduced motion,
  demo/waitlist modals, and an increased-text-size check.
- rig: `scripts/capture.mjs` (full matrix), `scripts/shot.mjs` (one-offs),
  `scripts/verify.mjs` (functional + determinism suite),
  `scripts/probe.mjs` (live scene introspection, dev only).

## remaining limitations that truly need custom production assets
- the cast is stylized (quaternius, cc0). they read as architectural-model
  figures at the intended camera distances; archviz-grade humans would need
  custom character production.
- clip-driven idle/interact poses are generic; task-specific hand poses
  (typing, writing, handing over documents) would need bespoke animation.
- procedural box-and-cylinder furniture reads as a premium scale model, not
  photoreal product furniture; going past that ceiling would require
  sculpted glb assets with baked texture sets, which this pass deliberately
  avoids to stay license-free and keep the bundle procedural.

---

# September 23: Mo copy on current Node 3D site (local candidate)

The earlier July visual-quality report above is historical. This section documents the isolated copy-only candidate in `/Users/moud/coding/.worktrees/omnus-clinic-mo-copy` on `design/omnus-clinic-mo-copy`, based on `0df8c3ee2c8c295c93ff85c214c021c270515062` plus the uncommitted cold-load runtime overlay. No publication, commit, push, server/clinical operation, or live cold-load worktree edit occurred.

## User, source, and job

Independent physician evaluating an integrated hematology-first clinic workspace while retaining final clinical authority. `/Users/moud/jarvis/build-shop/projects/omnus/NEXT.md:197` and `/Users/moud/coding/node-omnuslabs/VALIDATION.md:141-145` identify Moud's supplied Mo homepage copy as locally implemented on September 10. The editable source is `/Users/moud/coding/node-omnuslabs/src/data/copy.json:3-7,20-21,32-33` for hero/visit/waitlist and `/Users/moud/coding/node-omnuslabs/src/components/ClinicalJourney.astro:4-25` for visit details. Those files later accrued workflow polish; they are not a frozen verbatim September 10 snapshot. The upload-instructions handoff contains access commands, not copy. `/Users/moud/jarvis/build-shop/projects/omnus/CONTEXT.md:7` sets the current positioning constraints: lead with Mo's “The Clinical AI Workspace,” avoid box language, and distinguish future capability using “designed to.”

## Exact product copy diff

Only `src/content/copy.ts` was edited relative to the cold-load live source. Mo's headline and subheader are verbatim; the rest adapts Mo's meaning to the shorter 3D scene slots and existing capability states. All strings below are old → new:

- Opening eyebrow: `The clinical AI workspace` → `Omnus Labs`
- Opening H1: `Your clinic. Wherever you practice.` → `The Clinical AI Workspace`
- Opening body: `A complete clinical AI workspace, designed to run on your own hardware. Charting, visits, record synthesis, decision support, and physician-approved orders, starting with hematology.` → `Run your complete clinic from home, office, or anywhere with power. Omnus is designed to bring charting, visits, record synthesis, decision support, and physician-approved orders together on your own hardware. We start with hematology.`
- Intake body: `Agents are designed to organize intake, flag what needs attention, and assemble the patient’s history before the physician walks in.` → `Agents are designed to bring the patient’s presentation, outside records, referral notes, and previous encounters into one pre-visit summary for physician review.`
- Real-time AI body: `The doctor focuses on the patient. Omnus transcribes the visit and extracts clinical details from the conversation as it happens.` → `Stay focused on the patient while Omnus transcribes the conversation and extracts clinical details as the visit unfolds. Note drafting and proposed orders are designed for physician review, not automatic approval.`
- Physician sign-off body: `Omnus prepares the draft. The physician reviews, corrects, and approves what becomes final. The agents assist; the doctor decides.` → `Omnus is designed to prepare a note and proposed orders for review before the encounter is finalized. Physician approval determines what is saved to the record and which next steps are authorized. The AI drafts, the doctor decides.`
- Follow-through body: `After physician approval, agents are designed to coordinate referrals and follow-up through connected systems and APIs.` → `After physician approval, agents are designed to coordinate follow-up, referrals, prescriptions, laboratory tests, and imaging through connected systems. Nothing proceeds on an AI draft alone.`
- Connected clinic body: `From triage to follow-through, one local operating layer connects the agents, the visit, and the work around it. The physician leads the care.` → `Omnus is designed to bring the patient timeline, live visit, draft note, and proposed orders into one workflow. The physician reviews and approves every clinical decision. The AI drafts, the doctor decides.`
- Conversion body: `Omnus gives independent physicians everything they need so a doctor can focus on being a doctor. Walk through the system with us, or follow along as it grows.` → `We start with hematology. Omnus is designed to bring the whole clinic workflow onto your own hardware, with every clinical decision reviewed by the physician. Walk through what works today, or follow along as the workspace grows.`

## Hierarchy, states and scope

Opening H1 → complete-clinic ambition and hematology wedge → eight-scene 3D physician journey → existing demo/waitlist conversion. The existing `Working now`, `Now expanding`, and `The system we’re building` labels, CTA names/targets, forms, loading and Retry, scroll gate, scene, geometry, model pack, and all presentation styles are unchanged. Future chart/order/record features are described as designed to. Neither this site nor its copy writes a chart or authorizes orders; no patient client or transcript behavior changed. The strong source assertion that every part of a complete clinic already runs locally was not transferred as an unqualified present-tense claim.

The worktree was made with `git worktree add` from the cold-load branch's HEAD, then its eight modified runtime files and two generated pack directories were overlaid. All 12 overlaid files match the cold-load source byte-for-byte. Local `node_modules` is a symlink to the installed sibling dependencies, not part of a release. Marketing copy scan found zero em dashes, zero box-language matches, and six `designed to` instances.

## Build, preview, responsive and accessibility evidence

`npm run build` PASS (TypeScript + Vite, 642 modules, 3.34s); `npm run lint` PASS; `git diff --check` PASS. Loopback-only production preview: `http://127.0.0.1:64838/`. Restart from this worktree with `npm run preview -- --host 127.0.0.1 --port 64838 --strictPort` after `npm run build`. The existing QA pose also works: `http://127.0.0.1:64838/?pose=0.58`.

Real Chromium at desktop 1440×900: new H1, canvas visible after loading, no scene error, scroll width/client width 1425/1425. At phone 390×844: opening H1, body, actions, and current-state line fit the opening region; canvas visible after loading, no scene error, scroll width/client width 390/390. The physician-review scene at `?pose=0.58` rendered its changed copy and scene on both sizes. Existing semantic H1, state chips and buttons remain, but no screen reader or physical phone was tested. Screenshots are for human visual inspection, not a claim of aesthetic acceptance:

- `docs/evidence/mo-copy/desktop-1440.png`
- `docs/evidence/mo-copy/phone-390.png`
- `docs/evidence/mo-copy/desktop-1440-review.png`
- `docs/evidence/mo-copy/phone-390-review.png`
- `docs/evidence/mo-copy/live-baseline-1280-review.png` (public baseline at 1280×633, not pixel-aligned with local 1440 capture)

Read-only public `https://node.omnuslabs.com/?pose=0.58` still shows the original H1/review copy, visible canvas and no scene error. It fetches the same content-addressed model pack `clinic-models.ab6a42b1a44d2448.zst` and CSS file `index-BXf8rVyX.css` as the local build. That plus exact runtime-source parity supports unchanged scene/loading/scroll implementation, not a pixel-exact comparison or a fresh cold-load timing guarantee. Source proof and browser rendering are distinct from human visual approval.

## Acceptance and open decision

Moud should approve the adapted Mo prose and real-browser visuals before the controller considers publication. Omnus Health should confirm current-versus-future clinical claims, particularly record synthesis and orders. Omnus CTO owns synthesis and the choice of short 3D-scene adaptation versus Mo's verbatim long-form paragraphs; Omnus Validator should independently review the candidate. No Node publication, apex/www change, clinical service change, DNS change, commit or push was performed or authorized by this local report.
