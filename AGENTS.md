# Clinic website product contract

Moud's explicit requirements govern this marketing site:

- The clinic tour always uses full scroll-driven 3D motion on desktop and phones, regardless of `prefers-reduced-motion`.
- Never add enable/disable, pause-motion, reduced-motion, opt-in-3D, or image/static-view switches. Do not reinterpret generic accessibility guidance as permission to reintroduce them.
- A genuine failed WebGL/model load may offer Retry. Retry is recovery, not a motion mode.
- Retain demand rendering and hidden/offscreen suspension to avoid wasting GPU work. These optimizations must not suppress the visible scroll-driven tour.
- Preserve the approved desktop composition, phone bounds-fit, character choreography, and left-column copy.

Run `node scripts/clinic-motion-contract.mjs` before release. GitHub Pages runs this gate before deployment. With the dev server running, `node scripts/clinic-iphone-motion.mjs` proves automatic character motion with both OS preferences; it also supports `BASE_URL` for built/public checks.

Browser-width/WebKit checks are not physical-iPhone acceptance. Describe their scope accurately.
