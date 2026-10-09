import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { listFiles, resolveFile, uploadToDrive, friendlyDriveError, FOLDER_NAME } from '../drive.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-'));
fs.writeFileSync(path.join(dir, 'report.txt'), 'hello drive');
fs.writeFileSync(path.join(dir, '.env'), 'SECRET=1');
fs.writeFileSync(path.join(dir, 'script.js'), 'x');
fs.writeFileSync(path.join(dir, 'notes.md'), '# n');

test('only safe file types are listed (no dotfiles, no .js)', () => {
  assert.deepEqual(listFiles(dir).map((f) => f.name).sort(), ['notes.md', 'report.txt']);
});
test('resolveFile blocks traversal, dotfiles, bad types and missing files', () => {
  assert.equal(resolveFile('report.txt', dir).mimeType, 'text/plain');
  for (const bad of ['../report.txt', '/etc/passwd', '.env', 'script.js', 'a/b.txt', '']) assert.throws(() => resolveFile(bad, dir), /./, bad);
  assert.throws(() => resolveFile('nothere.txt', dir), /could not find/);
});

function fakeDrive({ folderExists }) {
  const calls = [];
  return { calls, files: {
    list: async (a) => { calls.push(['list', a.q]); return { data: { files: folderExists ? [{ id: 'F1' }] : [] } }; },
    create: async (a) => { calls.push(['create', a]); return { data: a.media ? { id: 'FILE1', name: a.requestBody.name, webViewLink: 'https://drive.google.com/file/d/FILE1' } : { id: 'F2' } }; },
  } };
}
test('uploads into the existing app folder', async () => {
  const d = fakeDrive({ folderExists: true });
  const r = await uploadToDrive(d, resolveFile('report.txt', dir));
  const up = d.calls.find((c) => c[0] === 'create')[1];
  assert.deepEqual(up.requestBody, { name: 'report.txt', parents: ['F1'] });
  assert.equal(up.media.mimeType, 'text/plain');
  assert.equal(typeof up.media.body.pipe, 'function'); // a real stream
  assert.equal(r.link, 'https://drive.google.com/file/d/FILE1'); assert.equal(r.folder, FOLDER_NAME);
});
test('creates the folder first when it does not exist', async () => {
  const d = fakeDrive({ folderExists: false });
  await uploadToDrive(d, resolveFile('report.txt', dir));
  const creates = d.calls.filter((c) => c[0] === 'create');
  assert.equal(creates.length, 2);
  assert.equal(creates[0][1].requestBody.mimeType, 'application/vnd.google-apps.folder');
  assert.deepEqual(creates[1][1].requestBody.parents, ['F2']);
});
test('Google errors become helpful messages', () => {
  assert.match(friendlyDriveError(new Error('Google Drive API has not been used in project 123 before or it is disabled')).error, /not enabled/);
  assert.match(friendlyDriveError(Object.assign(new Error('Insufficient Permission'), { code: 403 })).error, /Connect Google again/);
  assert.match(friendlyDriveError(Object.assign(new Error('The user has exceeded storage quota'), { code: 403 })).error, /storage quota/);
  assert.equal(friendlyDriveError(new Error('invalid_grant')).status, 401);
});

let srv; const base = 'http://localhost:3779';
before(async () => {
  srv = spawn('node', ['index.js'], { env: { ...process.env, PORT: '3779', UPLOAD_DIR: dir, GOOGLE_CLIENT_ID: 'i', GOOGLE_CLIENT_SECRET: 's', GOOGLE_REDIRECT_URI: base + '/auth/callback', SUPABASE_URL: '', SUPABASE_KEY: '' } });
  await new Promise((r) => setTimeout(r, 1500));
});
after(() => srv.kill());
const post = (b) => fetch(base + '/api/drive/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });

test('GET /api/drive/files lists only allowed files', async () => {
  const j = await (await fetch(base + '/api/drive/files')).json();
  assert.deepEqual(j.files.map((f) => f.name).sort(), ['notes.md', 'report.txt']);
});
test('upload refused when Google is not connected', async () => assert.equal((await post({ device: 'nobody', name: 'report.txt' })).status, 401));
test('consent URL now asks for gmail.send AND drive.file', async () => {
  const r = await fetch(base + '/auth/google?device=d', { redirect: 'manual' });
  const loc = decodeURIComponent(r.headers.get('location'));
  assert.match(loc, /gmail\.send/); assert.match(loc, /drive\.file/);
});
test('drive check says not connected for an unknown device', async () => assert.equal((await (await fetch(base + '/api/drive/check?device=zzz')).json()).connected, false));
