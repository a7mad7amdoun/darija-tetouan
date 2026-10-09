require(__dirname + '/boot.js');
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log('FAIL', m)); };
(async function () {
  let prof = null;
  window.Auth = Object.assign(window.Auth || {}, { currentProfile: () => prof });
  await Storage.putProfile({ id: 'a', name: 'Ahmed', role: 'teacher' });
  await Storage.load('a');
  Store.set(Store.kRole, 'teacher');          // the teacher view chosen on this device
  prof = { id: 'a', role: 'teacher' };
  ok(UI.isTeacher() === true, 'signed-in teacher who chose the teacher view gets it');
  Storage.unload();
  await Storage.putProfile({ id: 'w', name: 'Wife', role: 'student' });
  await Storage.load('w');
  prof = { id: 'w', role: 'student' };
  Store.set(Store.kRole, 'teacher');          // even if the preference says teacher
  ok(Store.get(Store.kRole, 'student') === 'teacher', 'precondition: device preference is teacher');
  ok(UI.isTeacher() === false, 'signed-in student is never in the teacher view');
  prof = { id: 'w' };                         // a profile with no role at all
  ok(UI.isTeacher() === false, 'a profile with no role is treated as a student');
  prof = { id: 'local', local: true };
  ok(UI.isTeacher() === true, 'local, unsigned use keeps the switch');
  prof = null;
  ok(UI.isTeacher() === true, 'before anyone signs in (no profile), the preference stands');
  Store.set(Store.kRole, 'student'); prof = { id: 'a', role: 'teacher' };
  ok(UI.isTeacher() === false, 'a teacher who chose the student view sees the student view');
  console.log('=== ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})();
