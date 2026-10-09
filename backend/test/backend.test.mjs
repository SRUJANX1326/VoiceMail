import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { buildRaw } from '../gmail.js';

let srv, mock, base = 'http://localhost:3777';
before(async () => {
  mock = http.createServer((q, r) => { // fake OpenAI-compatible LLM (Groq-style)
    r.setHeader('content-type', 'application/json');
    r.end(JSON.stringify({ choices: [{ message: { content: '{"to":"","subject":"Sick leave","body":"Hello, I am sick."}' } }] }));
  }).listen(4666);
  srv = spawn('node', ['index.js'], { env: { ...process.env, PORT: '3777', GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'sec',
    GOOGLE_REDIRECT_URI: 'http://localhost:3777/auth/callback', LLM_PROVIDER: 'openai', OPENAI_API_KEY: 'k', OPENAI_BASE_URL: 'http://localhost:4666/v1', SUPABASE_URL: '', SUPABASE_KEY: '' } });
  await new Promise((r) => setTimeout(r, 1500));
});
after(() => { srv.kill(); mock.close(); });
const post = (u, b) => fetch(base + u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });

test('Gmail MIME is built correctly', () => {
  const raw = Buffer.from(buildRaw('me@gmail.com', { to: 'apc@gmail.com', subject: 'Sick leave ✓', body: 'Hello, I am sick.' }), 'base64url').toString();
  assert.match(raw, /^From: me@gmail\.com\r\nTo: apc@gmail\.com\r\n/);
  assert.match(raw, /Subject: =\?UTF-8\?B\?/);
  assert.equal(Buffer.from(raw.split('\r\n\r\n')[1], 'base64').toString(), 'Hello, I am sick.');
});
test('OAuth start redirects to Google with gmail.send scope', async () => {
  const r = await fetch(base + '/auth/google?device=d1', { redirect: 'manual' });
  assert.equal(r.status, 302);
  assert.match(r.headers.get('location'), /accounts\.google\.com.*gmail\.send/);
});
test('status: not connected', async () => assert.equal((await (await fetch(base + '/api/status?device=d1')).json()).connected, false));
test('send: rejects invalid recipient', async () => assert.equal((await post('/api/send', { device: 'd1', to: 'apc at gmail', subject: 's', body: 'b' })).status, 400));
test('send: rejects when Google is not connected (nothing sent)', async () => assert.equal((await post('/api/send', { device: 'd1', to: 'apc@gmail.com', subject: 's', body: 'b' })).status, 401));
test('draft endpoint works with LLM provider', async () => {
  const j = await (await post('/api/draft', { text: 'write to apc@gmail.com that I am sick' })).json();
  assert.equal(j.subject, 'Sick leave');
});
