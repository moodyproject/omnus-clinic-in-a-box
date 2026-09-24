# Node Mo-copy release freeze (September 23, 2026)

Kanban `t_1c351560`. Verification and freeze only. Nothing was deployed, activated, or merged.

## Frozen release identity

- Release source commit: `01fdbe12c0ffe307082d582b3fce0d5603b41a09` (`feat(clinic): publish Mo homepage copy with cold-load runtime`), branch `design/omnus-clinic-mo-copy`, PR https://github.com/moodyproject/omnus-clinic-in-a-box/pull/1 against `main`. The commit that adds this file changes only evidence documents and the root manifest. It does not change any build input.
- Dist: 27 files, 21,868,949 bytes.
- Dist artifact digest (same method as the live `51c6e768` digest): `80161b30e779723957977e8a5853c538cd3b314228260292ac75978a40b1e2be`.
- Per-file manifest: `build-evidence-manifest.sha256` (file SHA256 `7fbafd51b2b866244a8583be0bcb52a4b855e6a2ff06c9d0c0724d24b84fb08a`). This is the manifest-file hash that names the staged remote release directory `mo-sha256-7fbafd51…`. It is not the artifact digest above.
- Key payload: `assets/index-Bxd7d9Nb.js` `5134cd11678bc900f0776acb0a3a44f512b99e3eb2f4da3660a5e47ace50f92a`, `index.html` `bb73ce935638b24de4c218b08727e76f63f87cdc9c7d0d3bf842a1d407721f81`, model pack `models/pack/clinic-models.ab6a42b1a44d2448.zst` `ab6a42b1a44d2448f97a2aa638773eeb83615ebbd400ceb5635783ef1830bdd1`.

Artifact digest method: the SHA256 of compact JSON (`sort_keys`, separators `,` and `:`) of the list of `{path, bytes, sha256}` for every file in `dist`, sorted by path. The jq equivalent reproduced the live digest `51c6e768046d480035467c349b3efbee7b7bfcb3cf3d3c63bbd9e5cee9d6cbcf` from the Jarvis `candidate-manifest.json`.

## Cold-load inclusion check (PASS)

- Source: all 20 cold-load changes in `/Users/moud/coding/.worktrees/omnus-clinic-cold-load` are byte-identical in `01fdbe1`. That is 12 files plus 8 scripts. The files are the modified `index.html`, `vite.config.ts`, `src/App.tsx`, `src/lib/boot.ts`, `src/three/Experience.tsx`, `src/three/clinic/AcceptedClinic.tsx`, `src/three/clinic/acceptedModel.ts` and `src/vite-env.d.ts`, the new `src/three/clinic/pack/{loadPack.ts,manifest.json,manifest.ts}` and `public/models/pack/clinic-models.ab6a42b1a44d2448.zst`. The scripts are `scripts/{clinic-loading-check,clinic-loading-compare,clinic-loading-recovery,cold-load-bench,cold-load-parity,cold-load-recovery,pack-clinic-models}.mjs` and `scripts/clinic-loading-summary.py`. Relative to the cold-load source, the only other source change in `01fdbe1` is `src/content/copy.ts`.
- Live artifact: the 27-entry manifest of live `51c6e768` matches the current cold-load `dist` exactly.
- Candidate compared with live `51c6e768`: 25 of 27 files are identical, including the CSS, the three and vendor chunks, the zstd decoder, fonts, characters, models and the content-addressed pack. The 2 files that differ are `index.html` and the app chunk (`index-D5lZbRWU.js` became `index-Bxd7d9Nb.js`). That is the expected result of the copy-only change.

## Reproduction

```
git archive 01fdbe12c0ffe307082d582b3fce0d5603b41a09 | tar -x -C <dir>
# provide node_modules from the committed package-lock.json (npm ci)
npm run build
(cd dist && find . -type f | sort | xargs shasum -a 256) | diff - <(sort -k2 build-evidence-manifest.sha256)
```

A clean rebuild from the `git archive` of `01fdbe1` (using the sibling installed dependencies) produced all 27 files byte-identical to the manifest, with artifact digest `80161b30…e2be`.

## Deployment state (unchanged by this task)

The activation remains blocked. See `deployment/REPORT.md`. The release staged remotely at `/home/moud/omnus-node/releases/mo-sha256-7fbafd51…` is not active. The live service still runs `cold-sha256-51c6e768…`, which is also the immediate rollback target. Before any activation, Moud must approve the prose and visuals and Omnus Validator must review the candidate independently. No service, DNS, tunnel, apex/www or clinical change was made.
