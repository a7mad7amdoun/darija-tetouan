/* Runs every suite in this folder and sums them up.

     node tests/run.js

   Each suite loads the real files from js/ and data/ into Node, with an
   in-memory IndexedDB (idb-shim.js) and no network. Nothing here can reach
   the live database. Exit code is non-zero if anything fails. */
const { spawnSync } = require('child_process');
const path = require('path');
const SUITES = ['suite', 'sched', 'integrity', 'weak', 'audio', 'sess', 'peek',
                'throughput', 'converge', 'finder', 'role', 'render'];
let pass = 0, fail = 0, broken = [];
for (const s of SUITES) {
  const r = spawnSync(process.execPath, [path.join(__dirname, s + '.js')], { encoding: 'utf8', timeout: 120000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = /=== (\d+) passed, (\d+) failed ===/.exec(out);
  if (m) {
    pass += +m[1]; fail += +m[2];
    if (+m[2] || r.status) broken.push(s);
    console.log((+m[2] ? 'FAIL ' : 'ok   ') + s.padEnd(11) + m[1] + ' passed, ' + m[2] + ' failed');
  } else {
    /* render.js prints one line per view instead of a total */
    const bad = r.status !== 0 || /FAIL|Error|threw/i.test(out);
    if (bad) { fail++; broken.push(s); console.log('FAIL ' + s + '\n' + out.split('\n').slice(-15).join('\n')); }
    else console.log('ok   ' + s.padEnd(11) + 'every view renders');
  }
}
console.log('\n=== ' + pass + ' checks passed, ' + fail + ' failed' + (broken.length ? ' (' + broken.join(', ') + ')' : '') + ' ===');
process.exit(fail || broken.length ? 1 : 0);
