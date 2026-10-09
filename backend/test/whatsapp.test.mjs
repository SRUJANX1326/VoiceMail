import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { normalizePhone, buildLink } from '../whatsapp.js';
import { matchByName } from '../store.js';

test('normalizePhone', () => {
  const n = (x, cc) => normalizePhone(x, cc);
  assert.equal(n('98765 43210', '91'), '919876543210');
  assert.equal(n('09876543210', '91'), '919876543210');
  assert.equal(n('+91 98765-43210'), '919876543210');
  assert.equal(n('919876543210', '91'), '919876543210');          // idempotent
  assert.equal(n('+1 (415) 555-2671'), '14155552671');
  assert.equal(n('0014155552671'), '14155552671');
  assert.equal(n('9876543210', '1'), '19876543210');                // other default country
  for (const bad of ['', 'abc', '12345', '+123', '1234567890123456']) assert.equal(n(bad, '91'), null, bad);
});
test('buildLink encodes the message', () => {
  assert.equal(buildLink('919876543210', "I'll be late & sorry?"), "https://wa.me/919876543210?text=I'll%20be%20late%20%26%20sorry%3F");
});
test('name matching', () => {
  const list = [{ name: 'Rahul Sharma', phone: '1' }, { name: 'Priya', phone: '2' }, { name: 'Boss', phone: '3' }];
  assert.equal(matchByName(list, 'priya').contact.phone, '2');
  assert.equal(matchByName(list, 'rahul').contact.phone, '1');
  assert.equal(matchByName(list, 'rahul i will be late').contact.phone, '1');
  assert.equal(matchByName(list, 'nobody').contact, null);
});

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wa-'));
let srv; const base = 'http://localhost:3780';
before(async () => {
  srv = spawn('node', ['index.js'], { env: { ...process.env, PORT: '3780', DATA_DIR: dir, DEFAULT_COUNTRY_CODE: '91', GOOGLE_CLIENT_ID: 'i', GOOGLE_CLIENT_SECRET: 's', GOOGLE_REDIRECT_URI: base + '/auth/callback', SUPABASE_URL: '', SUPABASE_KEY: '' } });
  await new Promise((r) => setTimeout(r, 1500));
});
after(() => srv.kill());
const post = (u, b) => fetch(base + u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });

test('save, list and find a WhatsApp contact (per device)', async () => {
  assert.equal((await post('/api/whatsapp/contacts', { device: 'd1', name: 'Rahul', phone: '98765 43210' })).status, 200);
  assert.equal((await post('/api/whatsapp/contacts', { device: 'd1', name: 'Rahul K', phone: '+91 98765 43210' })).status, 200); // same number -> updated, not duplicated
  const list = await (await fetch(base + '/api/whatsapp/contacts?device=d1')).json();
  assert.deepEqual(list.contacts, [{ name: 'Rahul K', phone: '919876543210' }]);
  assert.equal((await (await post('/api/whatsapp/find', { device: 'd1', name: 'rahul' })).json()).contact.phone, '919876543210');
  assert.deepEqual((await (await fetch(base + '/api/whatsapp/contacts?device=d2')).json()).contacts, []);
});
test('invalid phone is rejected on save and on link', async () => {
  assert.equal((await post('/api/whatsapp/contacts', { device: 'd1', name: 'X', phone: '123' })).status, 400);
  assert.equal((await post('/api/whatsapp/link', { phone: '123', text: 'hi' })).status, 400);
  assert.equal((await post('/api/whatsapp/link', { phone: '9876543210', text: '  ' })).status, 400);
});
test('link route builds a wa.me URL', async () => {
  const j = await (await post('/api/whatsapp/link', { phone: '9876543210', text: 'Hello there' })).json();
  assert.equal(j.url, 'https://wa.me/919876543210?text=Hello%20there'); assert.equal(j.display, '+919876543210');
});
