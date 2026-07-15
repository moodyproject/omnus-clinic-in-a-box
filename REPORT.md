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
