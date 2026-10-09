// Device-scoped persistence: Supabase when configured, local JSON files otherwise.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const tokenFile = path.join(dir, 'tokens.json');
const contactsFile = path.join(dir, 'contacts.json');
const historyFile = path.join(dir, 'email-history.json');
const waFile = path.join(dir, 'whatsapp-contacts.json');
let sb = null;
const SB_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/(rest\/v1)?\/?$/, ''); // accept URL with/without /rest/v1 or trailing slash
const SB_KEY = (process.env.SUPABASE_KEY || '').trim();
if (process.env.VERCEL && !(SB_URL && SB_KEY)) {
  throw new Error('On Vercel the disk is read-only, so SUPABASE_URL and SUPABASE_KEY must be set in Vercel -> Settings -> Environment Variables.');
}
if (SB_URL && SB_KEY) {
  if (!/^https?:\/\//.test(SB_URL)) throw new Error('SUPABASE_URL must look like https://YOUR-PROJECT.supabase.co');
  const { createClient } = await import('@supabase/supabase-js');
  sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  console.log('Persistence: Supabase (tokens, contacts, email history)');
} else console.log('Persistence: local JSON files in backend/data (contacts and email history work without Supabase)');
const read = (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const write = (file, data) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2)); };
export async function save(device, refresh_token, email) {
  if (sb) { const { error } = await sb.from('google_tokens').upsert({ device_id: device, refresh_token, email }); if (error) throw error; return; }
  const all = read(tokenFile); all[device] = { refresh_token, email }; write(tokenFile, all);
}
export async function load(device) {
  if (sb) { const { data, error } = await sb.from('google_tokens').select('refresh_token,email').eq('device_id', device).maybeSingle(); if (error) throw error; return data || null; }
  return read(tokenFile)[device] || null;
}
export async function listContacts(device) {
  if (sb) { const { data, error } = await sb.from('contacts').select('name,email').eq('device_id', device).order('name'); if (error) throw error; return data || []; }
  return read(contactsFile)[device] || [];
}
export async function saveContact(device, name, email) {
  const contact = { device_id: device, name: String(name || '').trim() || email.split('@')[0], email: String(email || '').trim().toLowerCase(), updated_at: new Date().toISOString() };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new Error('Please provide a valid email address.');
  if (sb) { const { error } = await sb.from('contacts').upsert(contact, { onConflict: 'device_id,email' }); if (error) throw error; return { name: contact.name, email: contact.email }; }
  const all = read(contactsFile); const list = all[device] || [];
  const idx = list.findIndex(c => c.email.toLowerCase() === contact.email);
  const saved = { name: contact.name, email: contact.email, updated_at: contact.updated_at };
  if (idx >= 0) list[idx] = saved; else list.push(saved);
  all[device] = list; write(contactsFile, all); return { name: saved.name, email: saved.email };
}
export async function findContact(device, query) {
  const list = await listContacts(device); const q = String(query || '').trim().toLowerCase();
  const exact = list.find(c => c.name.toLowerCase() === q || c.email.toLowerCase() === q);
  const matches = exact ? [exact] : list.filter(c => c.name.toLowerCase().includes(q) || q.split(/\s+/).every(w => c.name.toLowerCase().includes(w)));
  return { contact: matches.length === 1 ? matches[0] : null, contacts: matches.slice(0, 5) };
}
export async function getEmailHistory(device, email) {
  if (sb) { const { data, error } = await sb.from('email_history').select('subject,body,created_at').eq('device_id', device).eq('recipient_email', email.toLowerCase()).order('created_at', { ascending: false }).limit(10); if (error) throw error; return data || []; }
  return (read(historyFile)[device] || []).filter(h => h.recipient_email.toLowerCase() === email.toLowerCase()).slice(-10).reverse();
}
export async function saveEmailHistory(device, email, subject, body) {
  const item = { device_id: device, recipient_email: email.toLowerCase(), subject: String(subject || ''), body: String(body || ''), created_at: new Date().toISOString() };
  if (sb) { const { error } = await sb.from('email_history').insert(item); if (error) throw error; return; }
  const all = read(historyFile); all[device] ||= []; all[device].push(item); all[device] = all[device].slice(-500); write(historyFile, all);
}

export const usingSupabase = () => !!sb;

/** Verifies the connection, the key and that the 3 tables exist. Used at startup and by GET /api/health. */
export async function health() {
  if (!sb) return { store: 'file', ok: true };
  const tables = {};
  const timeout = new Promise((r) => setTimeout(() => r({ error: { message: 'fetch failed: Supabase did not answer within 8 seconds' } }), 8000));
  for (const t of ['google_tokens', 'contacts', 'email_history', 'whatsapp_contacts']) {
    const { error } = await Promise.race([sb.from(t).select('device_id').limit(1), timeout]);
    tables[t] = error ? error.message || String(error) : 'ok';
  }
  const bad = Object.entries(tables).filter(([, v]) => v !== 'ok');
  let hint;
  if (bad.length) {
    const msg = bad.map(([, v]) => v).join(' ');
    hint = /schema cache|does not exist|relation/i.test(msg) ? 'Tables are missing: run supabase/schema.sql in the Supabase SQL Editor.'
      : /invalid api key|jwt|apikey|unauthor/i.test(msg) ? 'The key is wrong: use the Secret key (sb_secret_...) from Settings > API Keys.'
      : /fetch failed|ENOTFOUND|getaddrinfo/i.test(msg) ? 'Cannot reach Supabase: check SUPABASE_URL and your internet.' : undefined;
  }
  return { store: 'supabase', ok: bad.length === 0, tables, hint };
}

/** Used by scripts/migrate-local-to-supabase.js */
export async function importLocal() {
  if (!sb) throw new Error('Set SUPABASE_URL and SUPABASE_KEY in backend/.env first.');
  const out = { tokens: 0, contacts: 0, history: 0, whatsapp: 0 };
  for (const [device, v] of Object.entries(read(tokenFile))) {
    const { error } = await sb.from('google_tokens').upsert({ device_id: device, refresh_token: v.refresh_token, email: v.email }); if (error) throw error; out.tokens++;
  }
  for (const [device, list] of Object.entries(read(contactsFile))) for (const c of list) {
    const { error } = await sb.from('contacts').upsert({ device_id: device, name: c.name, email: c.email.toLowerCase(), updated_at: c.updated_at || new Date().toISOString() }, { onConflict: 'device_id,email' }); if (error) throw error; out.contacts++;
  }
  for (const [device, list] of Object.entries(read(historyFile))) for (const h of list) {
    const { error } = await sb.from('email_history').insert({ device_id: device, recipient_email: h.recipient_email, subject: h.subject, body: h.body, created_at: h.created_at }); if (error) throw error; out.history++;
  }
  for (const [device, list] of Object.entries(read(waFile))) for (const c of list) {
    const { error } = await sb.from('whatsapp_contacts').upsert({ device_id: device, name: c.name, phone: c.phone, updated_at: c.updated_at || new Date().toISOString() }, { onConflict: 'device_id,phone' }); if (error) throw error; out.whatsapp++;
  }
  return out;
}

// ---------- WhatsApp contacts (name -> phone digits) ----------
const wordsOf = (x) => String(x).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
export function matchByName(list, query) {
  const q = wordsOf(query);
  if (!q.length) return { contact: null, contacts: [] };
  const exact = list.find((c) => c.name.toLowerCase() === String(query).trim().toLowerCase());
  if (exact) return { contact: exact, contacts: [exact] };
  const hits = list.filter((c) => { const n = wordsOf(c.name); return n.length && (n.every((w) => q.includes(w)) || q.every((w) => n.includes(w)) || (q.length > 2 && n[0].length >= 3 && q.includes(n[0]))); }); // 3rd rule: first name inside a longer spoken phrase
  return { contact: hits.length === 1 ? hits[0] : null, contacts: hits.slice(0, 5) };
}
export async function listWaContacts(device) {
  if (sb) { const { data, error } = await sb.from('whatsapp_contacts').select('name,phone').eq('device_id', device).order('name'); if (error) throw error; return data || []; }
  return (read(waFile)[device] || []).map(({ name, phone }) => ({ name, phone }));
}
export async function saveWaContact(device, name, phone) {
  const row = { device_id: device, name: String(name || '').trim() || phone, phone: String(phone), updated_at: new Date().toISOString() };
  if (sb) { const { error } = await sb.from('whatsapp_contacts').upsert(row, { onConflict: 'device_id,phone' }); if (error) throw error; return { name: row.name, phone: row.phone }; }
  const all = read(waFile); const list = all[device] || [];
  const i = list.findIndex((c) => c.phone === row.phone);
  const saved = { name: row.name, phone: row.phone, updated_at: row.updated_at };
  if (i >= 0) list[i] = saved; else list.push(saved);
  all[device] = list; write(waFile, all);
  return { name: saved.name, phone: saved.phone };
}
export async function findWaContact(device, query) { return matchByName(await listWaContacts(device), query); }
