import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { draftEmail, chat, suggestAddition } from './gemini.js';
import { authUrl, exchange, sendMail, client } from './gmail.js';
import { google } from 'googleapis';
import { normalizePhone, buildLink, displayPhone } from './whatsapp.js';
import { listFiles, resolveFile, uploadToDrive, driveFor, friendlyDriveError, FOLDER_NAME } from './drive.js';
import * as store from './store.js';

const app = express();
app.use(express.json({ limit: '100kb' }));
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/dist');
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(500).json({ error: e.message || 'Server error' });
});

// ---- Google OAuth (opened in the phone's real browser; Google blocks WebViews) ----
app.get('/auth/google', (req, res) => {
  if (!req.query.device) return res.status(400).send('Missing device');
  res.redirect(authUrl(String(req.query.device)));
});

app.get('/auth/callback', wrap(async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code) return res.status(400).send(`Google sign-in failed: ${error || 'no code'}`);
  const { refresh_token, email, scope } = await exchange(String(code));
  if (!refresh_token) return res.status(400).send('No refresh token. Remove the app at myaccount.google.com/permissions and retry.');
  await store.save(String(state), refresh_token, email);
  const warn = [!scope.includes('gmail.send') && 'Sending email was NOT allowed.', !scope.includes('drive.file') && 'Google Drive was NOT allowed.'].filter(Boolean);
  res.send(`<body style="font-family:sans-serif;text-align:center;padding:3rem"><h2>Connected as ${email}</h2>${warn.length ? `<p style="color:#c00">${warn.join(' ')} Tap Connect Google again and tick ALL the checkboxes.</p>` : ''}<p>Return to the Voice Mail app.</p></body>`);
}));

app.get('/api/health', wrap(async (_, res) => res.json(await store.health())));

app.get('/api/status', wrap(async (req, res) => {
  const t = await store.load(String(req.query.device || ''));
  res.json({ connected: !!t, email: t?.email || null });
}));

app.post('/api/chat', wrap(async (req, res) => {
  const { text, history } = req.body;
  if (!text) return res.status(400).json({ error: 'No text' });
  res.json(await chat(text, Array.isArray(history) ? history : []));
}));

app.post('/api/draft', wrap(async (req, res) => {
  const { text, current } = req.body;
  if (!text) return res.status(400).json({ error: 'No text' });
  res.json(await draftEmail(text, current));
}));


app.get('/api/contacts', wrap(async (req, res) => {
  const device = String(req.query.device || '');
  if (!device) return res.status(400).json({ error: 'Missing device' });
  res.json({ contacts: await store.listContacts(device) });
}));
app.post('/api/contacts/find', wrap(async (req, res) => {
  const { device, name } = req.body;
  if (!device || !name) return res.status(400).json({ error: 'Device and contact name are required' });
  const result = await store.findContact(String(device), String(name));
  if (result.contact) result.history = await store.getEmailHistory(String(device), result.contact.email);
  res.json(result);
}));
app.post('/api/contacts', wrap(async (req, res) => {
  const { device, name, email } = req.body;
  if (!device || !email) return res.status(400).json({ error: 'Device and email are required' });
  res.json({ contact: await store.saveContact(String(device), String(name || ''), String(email)) });
}));
app.post('/api/suggestion', wrap(async (req, res) => {
  const { device, name, subject, bodyInstruction } = req.body;
  if (!device) return res.status(400).json({ error: 'Missing device' });
  const history = await store.getEmailHistory(String(device), String(req.body.email || ''));
  res.json(await suggestAddition({ name, subject, bodyInstruction, history: Array.isArray(req.body.history) && req.body.history.length ? req.body.history : history }));
}));

app.post('/api/send', wrap(async (req, res) => {
  const { device, to, subject, body } = req.body;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to || '')) return res.status(400).json({ error: 'Invalid recipient address' });
  const t = await store.load(String(device || ''));
  if (!t) return res.status(401).json({ error: 'Google account not connected' });
  try {
    await sendMail(t.refresh_token, t.email, { to, subject: subject || '(no subject)', body: body || '' });
  } catch (e) {
    if (/invalid_grant/.test(String(e))) return res.status(401).json({ error: 'Google connection expired. Please reconnect.' });
    throw e;
  }
  try { await store.saveEmailHistory(String(device), String(to), String(subject), String(body)); } catch (e) { console.warn('Email was sent but history could not be saved:', e.message); }
  res.json({ ok: true });
}));

app.get('/api/drive/files', wrap(async (_, res) => res.json({ folder: FOLDER_NAME, files: listFiles() })));

// Diagnoses the real cause of a failed upload: permission box not ticked vs Drive API not enabled.
app.get('/api/drive/check', wrap(async (req, res) => {
  const t = await store.load(String(req.query.device || ''));
  if (!t) return res.json({ connected: false });
  const auth = client(); auth.setCredentials({ refresh_token: t.refresh_token });
  const out = { connected: true, email: t.email, gmailPermission: null, drivePermission: null, driveApi: null };
  try {
    const { token } = await auth.getAccessToken();
    const sc = (await auth.getTokenInfo(token)).scopes || [];
    out.gmailPermission = sc.some((x) => x.endsWith('gmail.send'));
    out.drivePermission = sc.some((x) => x.endsWith('drive.file'));
  } catch (e) { out.driveApi = friendlyDriveError(e).error; return res.json(out); }
  try { await google.drive({ version: 'v3', auth }).files.list({ pageSize: 1, fields: 'files(id)' }); out.driveApi = 'ok'; }
  catch (e) { console.error('Drive check failed:', e.message); out.driveApi = friendlyDriveError(e).error; }
  res.json(out);
}));

app.post('/api/drive/upload', wrap(async (req, res) => {
  const { device, name } = req.body;
  const t = await store.load(String(device || ''));
  if (!t) return res.status(401).json({ error: 'Google account not connected' });
  let file;
  try { file = resolveFile(name); } catch (e) { return res.status(e.status || 400).json({ error: e.message }); }
  try {
    res.json(await uploadToDrive(driveFor(t.refresh_token), file));
  } catch (e) {
    console.error('Drive upload failed:', e.message);
    const f = friendlyDriveError(e);
    res.status(f.status).json({ error: f.error });
  }
}));

// ---- WhatsApp (click-to-chat) ----
const needDevice = (req, res) => { const d = String(req.query.device || req.body?.device || ''); if (!d) { res.status(400).json({ error: 'Missing device' }); return null; } return d; };
app.get('/api/whatsapp/contacts', wrap(async (req, res) => { const d = needDevice(req, res); if (d) res.json({ contacts: await store.listWaContacts(d) }); }));
app.post('/api/whatsapp/find', wrap(async (req, res) => {
  const d = needDevice(req, res); if (!d) return;
  if (!req.body.name) return res.status(400).json({ error: 'Name required' });
  res.json(await store.findWaContact(d, String(req.body.name)));
}));
app.post('/api/whatsapp/contacts', wrap(async (req, res) => {
  const d = needDevice(req, res); if (!d) return;
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ error: 'That phone number does not look valid.' });
  res.json({ contact: await store.saveWaContact(d, String(req.body.name || ''), phone) });
}));
app.post('/api/whatsapp/link', wrap(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const text = String(req.body.text || '').trim();
  if (!phone) return res.status(400).json({ error: 'That phone number does not look valid. Include the country code if it is not an Indian number.' });
  if (!text) return res.status(400).json({ error: 'The message is empty.' });
  res.json({ url: buildLink(phone, text), phone, display: displayPhone(phone) });
}));

app.use(express.static(dist));
app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html')));

export default app;

if (!process.env.VERCEL) app.listen(process.env.PORT || 3000, async () => {
  console.log(`Server on http://localhost:${process.env.PORT || 3000}`);
  try {
    const h = await store.health();
    if (h.store === 'supabase') console.log(h.ok ? 'Supabase check: OK (4 tables found)' : `Supabase check FAILED: ${JSON.stringify(h.tables)}${h.hint ? '\n  -> ' + h.hint : ''}`);
  } catch (e) { console.warn('Supabase check error:', e.message); }
});
