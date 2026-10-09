import test from 'node:test';
import assert from 'node:assert/strict';
import { Dialog, spokenFileName } from '../src/dialog.js';

function make(files = [{ name: 'report.txt', size: 120, sizeLabel: '120 bytes' }], failUpload = false) {
  const uploads = [];
  const api = {
    chat: async () => ({ intent: 'chat', reply: 'Hi there.' }),
    driveFiles: async () => ({ folder: 'Voice Mail Assistant', files }),
    driveUpload: async (name) => { if (failUpload) throw new Error('Drive permission is missing.'); uploads.push(name); return { link: 'https://drive.google.com/x' }; },
  };
  return { d: new Dialog(api), uploads };
}

test('spoken file names', () => {
  assert.equal(spokenFileName('upload report dot t x t to drive'), 'report.txt');
  assert.equal(spokenFileName('upload report.txt to my google drive'), 'report.txt');
  assert.equal(spokenFileName('notes dot text'), 'notes.txt');
  assert.equal(spokenFileName('send it'), null);
});

test('upload by name: asks for confirmation first, uploads nothing yet', async () => {
  const { d, uploads } = make();
  const r = await d.handle('upload report dot txt to my google drive');
  assert.match(r.say, /Upload report\.txt .* Shall I go ahead\?/);
  assert.equal(d.state, 'confirm_upload'); assert.equal(d.awaitingConfirmation, true);
  assert.equal(uploads.length, 0);
});

test('confirm -> uploaded exactly once', async () => {
  const { d, uploads } = make();
  await d.handle('upload report.txt to drive');
  const r = await d.handle('yes please');
  assert.deepEqual(uploads, ['report.txt']);
  assert.equal(r.uploaded, true); assert.equal(d.state, 'idle');
});

test('rejecting the confirmation does NOT upload', async () => {
  const { d, uploads } = make();
  await d.handle('upload report.txt to drive');
  const r = await d.handle('no');
  assert.equal(uploads.length, 0); assert.equal(r.uploaded, undefined); assert.equal(d.state, 'idle');
});

test('cancel and unclear answers never upload', async () => {
  const { d, uploads } = make();
  await d.handle('upload report.txt to drive');
  await d.handle('hmm what');
  assert.equal(d.state, 'confirm_upload');
  await d.handle('cancel');
  assert.equal(uploads.length, 0);
});

test('no file named: single file is picked automatically, still needs confirmation', async () => {
  const { d, uploads } = make();
  assert.match((await d.handle('upload a file to my drive')).say, /Upload report\.txt/);
  assert.equal(uploads.length, 0);
});

test('several files: asks which one, then confirms', async () => {
  const { d, uploads } = make([{ name: 'report.txt', size: 1, sizeLabel: '1 bytes' }, { name: 'notes.md', size: 2, sizeLabel: '2 bytes' }]);
  assert.match((await d.handle('upload a file to drive')).say, /Which file\? I can see report\.txt, notes\.md/);
  assert.match((await d.handle('the notes one')).say, /Upload notes\.md/);
  await d.handle('yes');
  assert.deepEqual(uploads, ['notes.md']);
});

test('unknown file name: lists what exists, uploads nothing', async () => {
  const { d, uploads } = make();
  assert.match((await d.handle('upload secret dot txt to drive')).say, /could not find secret\.txt/);
  assert.equal(uploads.length, 0);
});

test('failed upload keeps the confirmation open and tells the reason', async () => {
  const { d } = make(undefined, true);
  await d.handle('upload report.txt to drive');
  const r = await d.handle('yes');
  assert.match(r.say, /upload failed.*Drive permission is missing/);
  assert.equal(d.state, 'confirm_upload');
});

test('hard guard: doUpload outside the confirm state does nothing', async () => {
  const { d, uploads } = make();
  await d.handle('upload report.txt to drive');
  d.state = 'idle';
  await d.doUpload();
  assert.equal(uploads.length, 0);
});

test('an email request that mentions drive still starts the email flow, not an upload', async () => {
  const { d, uploads } = make();
  d.startEmail = async () => ({ say: 'email flow', speech: 'email flow' });
  assert.equal((await d.handle('write an email to my boss about the drive')).say, 'email flow');
  assert.equal(uploads.length, 0);
});

test('"check my drive permission" explains the real problem', async () => {
  const ask = async (r) => { const d = new Dialog({ driveCheck: async () => r }); return (await d.handle('check my drive permission')).say; };
  assert.match(await ask({ connected: false }), /not connected/);
  assert.match(await ask({ connected: true, gmailPermission: true, drivePermission: false }), /Drive permission box was not ticked/);
  assert.match(await ask({ connected: true, gmailPermission: false, drivePermission: false }), /Gmail permission box/);
  assert.match(await ask({ connected: true, gmailPermission: true, drivePermission: true, driveApi: 'The Google Drive API is not enabled.' }), /Drive says: The Google Drive API is not enabled/);
  assert.match(await ask({ connected: true, gmailPermission: true, drivePermission: true, driveApi: 'ok' }), /Everything is set up/);
});
