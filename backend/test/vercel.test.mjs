import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawnSync } from 'node:child_process';

test('on Vercel without Supabase it fails with a clear message', () => {
  const r = spawnSync('node', ['-e', "import('../api/index.js')"], { env: { ...process.env, VERCEL: '1', SUPABASE_URL: '', SUPABASE_KEY: '' }, encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /SUPABASE_URL and SUPABASE_KEY must be set in Vercel/);
});

test('serverless handler serves /api and /auth like the normal server', async () => {
  const sb = http.createServer((q, r) => { r.setHeader('content-type', 'application/json'); r.end('[]'); }).listen(4888);
  process.env.VERCEL = '1'; process.env.SUPABASE_URL = 'http://localhost:4888'; process.env.SUPABASE_KEY = 'k';
  process.env.GOOGLE_CLIENT_ID = 'id'; process.env.GOOGLE_CLIENT_SECRET = 's'; process.env.GOOGLE_REDIRECT_URI = 'https://my-app.vercel.app/auth/callback';
  const { default: handler } = await import('../../api/index.js');
  const srv = http.createServer(handler).listen(4889);
  try {
    const health = await (await fetch('http://localhost:4889/api/health')).json();
    assert.equal(health.store, 'supabase'); assert.equal(health.ok, true);
    const r = await fetch('http://localhost:4889/auth/google?device=d', { redirect: 'manual' });
    assert.equal(r.status, 302);
    assert.match(decodeURIComponent(r.headers.get('location')), /redirect_uri=https:\/\/my-app\.vercel\.app\/auth\/callback/);
    assert.equal((await fetch('http://localhost:4889/api/status?device=x').then((x) => x.json())).connected, false);
  } finally { srv.close(); sb.close(); }
});
