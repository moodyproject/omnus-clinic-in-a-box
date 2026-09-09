import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

// Locked product contract: the clinic tour always uses full scroll motion.
// OS preferences cannot select still poses, and visitors get no motion switch.
const app = fs.readFileSync('src/App.tsx', 'utf8')
const ast = ts.createSourceFile('App.tsx', app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
let fixedFullMotion = false
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'reducedMotion') {
    fixedFullMotion = node.initializer?.kind === ts.SyntaxKind.FalseKeyword
  }
  ts.forEachChild(node, visit)
}
visit(ast)
assert.ok(fixedFullMotion, 'App must keep reducedMotion fixed to false; no OS/device/visitor-selected still tour')
assert.ok(!app.includes('usePrefersReducedMotion'), 'OS Reduce Motion must not disable the clinic tour')
for (const path of ['src/App.tsx', 'src/scroll/JourneySection.tsx', 'src/styles/journey.css', 'src/three/CameraRig.tsx']) {
  assert.doesNotMatch(fs.readFileSync(path, 'utf8'), /onToggleMotion|toggle-motion|motion-preference|Enable full motion|Use reduced motion/, `motion controls are forbidden: ${path}`)
}
console.log('PASS: always-on tour contract; no motion toggle or OS-selected still mode')
