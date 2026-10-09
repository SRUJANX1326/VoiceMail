import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// ---- tiny in-memory PostgREST fake (what supabase-js talks to) ----
const PK = { google_tokens: ['device_id'], contacts: ['device_id', 'email'], email_history: null, whatsapp_contacts: ['device_id', 'phone'] };
const db = { google_tokens: [], contacts: [], email_history: [], whatsapp_contacts: [] };
let nextId = 1, missing = new Set(), calls = [];
const mock = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x'); const table = u.pathname.split('/').pop();
  let raw = ''; q.on('data', (d) => (raw += d)); q.on('end', () => {
    calls.push(`${q.method} ${table}`); r.setHeader('content-type', 'application/json');
    if (!(table in db) || missing.has(table)) { r.statusCode = 404; return r.end(JSON.stringify({ code: 'PGRST205', message: `Could not find the table 'public.${table}' in the schema cache` })); }
    if (q.headers.apikey !== 'sb_secret_test') { r.statusCode = 401; return r.end(JSON.stringify({ message: 'Invalid API key' })); }
    if (q.method === 'POST') {
      const rows = [].concat(JSON.parse(raw));
      for (const row of rows) {
        const pk = PK[table];
        const i = pk ? db[table].findIndex((x) => pk.every((k) => x[k] === row[k])) : -1;
        if (i >= 0) db[table][i] = { ...db[table][i], ...row }; else db[table].push(pk ? row : { id: nextId++, ...row });
      }
      r.statusCode = 201; return r.end();
    }
    let rows = db[table].filter((x) => [...u.searchParams].every(([k, v]) => !v.startsWith('eq.') || String(x[k]) === v.slice(3)));
    const ord = u.searchParams.get('order');
    if (ord) { const [f, d] = ord.split('.'); rows = [...rows].sort((a, b) => (a[f] > b[f] ? 1 : -1) * (d === 'desc' ? -1 : 1)); }
    if (u.searchParams.get('limit')) rows = rows.slice(0, +u.searchParams.get('limit'));
    const sel = u.searchParams.get('select');
    if (sel && sel !== '*') rows = rows.map((x) => Object.fromEntries(sel.split(',').map((c) => [c, x[c]]))); // like PostgREST: only requested columns
    r.end(JSON.stringify(rows));
  });
});
let store;
before(async () => {
  await new Promise((r) => mock.listen(4777, r));
  process.env.SUPABASE_URL = 'http://localhost:4777/rest/v1/'; // deliberately messy: must be cleaned
  process.env.SUPABASE_KEY = ' sb_secret_test ';
  store = await import('../store.js');
});
after(() => mock.close());

test('uses Supabase and health passes when tables exist', async () => {
  assert.equal(store.usingSupabase(), true);
  const h = await store.health();
  assert.equal(h.ok, true); assert.equal(h.store, 'supabase');
});
test('tokens: save + load round trip (and unknown device = null)', async () => {
  await store.save('dev1', 'refresh-abc', 'me@gmail.com');
  assert.deepEqual(await store.load('dev1'), { refresh_token: 'refresh-abc', email: 'me@gmail.com' });
  assert.equal(await store.load('nope'), null);
  await store.save('dev1', 'refresh-NEW', 'me@gmail.com'); // upsert, not duplicate
  assert.equal(db.google_tokens.length, 1);
  assert.equal((await store.load('dev1')).refresh_token, 'refresh-NEW');
});
test('contacts: save, upsert, list, find by name', async () => {
  await store.saveContact('dev1', 'Boss Rao', 'Rao@Gmail.com');
  await store.saveContact('dev1', 'Boss Rao Updated', 'rao@gmail.com');
  assert.equal(db.contacts.length, 1);
  assert.deepEqual(await store.listContacts('dev1'), [{ name: 'Boss Rao Updated', email: 'rao@gmail.com' }]);
  assert.equal((await store.findContact('dev1', 'rao')).contact.email, 'rao@gmail.com');
  assert.deepEqual(await store.listContacts('other-device'), []);
});
test('email history: insert and read newest first, per recipient', async () => {
  await store.saveEmailHistory('dev1', 'rao@gmail.com', 'First', 'b1');
  await new Promise((r) => setTimeout(r, 5));
  await store.saveEmailHistory('dev1', 'rao@gmail.com', 'Second', 'b2');
  await store.saveEmailHistory('dev1', 'other@gmail.com', 'X', 'b3');
  const h = await store.getEmailHistory('dev1', 'Rao@gmail.com');
  assert.deepEqual(h.map((x) => x.subject), ['Second', 'First']);
});
test('health explains a missing table', async () => {
  missing.add('contacts');
  const h = await store.health();
  assert.equal(h.ok, false); assert.match(h.hint, /schema\.sql/);
  missing.delete('contacts');
});
test('local data can be imported into Supabase', async () => {
  const fs = await import('node:fs'); const path = await import('node:path'); const { fileURLToPath } = await import('node:url');
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data');
  const existed = fs.existsSync(dir);
  fs.mkdirSync(dir, { recursive: true });
  const f = (n) => path.join(dir, n); const keep = {};
  for (const n of ['tokens.json', 'contacts.json', 'email-history.json']) keep[n] = fs.existsSync(f(n)) ? fs.readFileSync(f(n)) : null;
  fs.writeFileSync(f('tokens.json'), JSON.stringify({ devM: { refresh_token: 'rt', email: 'm@gmail.com' } }));
  fs.writeFileSync(f('contacts.json'), JSON.stringify({ devM: [{ name: 'Ann', email: 'ann@gmail.com' }] }));
  fs.writeFileSync(f('email-history.json'), JSON.stringify({ devM: [{ recipient_email: 'ann@gmail.com', subject: 'S', body: 'B', created_at: '2026-01-01T00:00:00Z' }] }));
  try { assert.deepEqual(await store.importLocal(), { tokens: 1, contacts: 1, history: 1, whatsapp: 0 }); assert.equal((await store.load('devM')).email, 'm@gmail.com'); }
  finally { for (const [n, v] of Object.entries(keep)) v ? fs.writeFileSync(f(n), v) : fs.rmSync(f(n), { force: true }); if (!existed) fs.rmSync(dir, { recursive: true, force: true }); }
});

test('whatsapp contacts in Supabase: save, upsert, find', async () => {
  await store.saveWaContact('dev1', 'Rahul', '919876543210');
  await store.saveWaContact('dev1', 'Rahul K', '919876543210');
  assert.equal(db.whatsapp_contacts.length, 1);
  assert.deepEqual(await store.listWaContacts('dev1'), [{ name: 'Rahul K', phone: '919876543210' }]);
  assert.equal((await store.findWaContact('dev1', 'rahul')).contact.phone, '919876543210');
});
test('health reports a missing whatsapp table', async () => {
  missing.add('whatsapp_contacts');
  const h = await store.health();
  assert.equal(h.ok, false); assert.match(h.hint, /schema\.sql/);
  missing.delete('whatsapp_contacts');
});
