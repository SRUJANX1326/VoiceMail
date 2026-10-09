function deviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) { id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(''); localStorage.setItem('deviceId', id); }
  return id;
}
export const device = deviceId();
async function call(url, body) {
  const r = await fetch(url, body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
}
export const status = () => call(`/api/status?device=${device}`);
export const chat = (text, history) => call('/api/chat', { text, history });
export const draft = (text, current) => call('/api/draft', { text, current });
export const send = (d) => call('/api/send', { device, ...d });
export const contacts = () => call(`/api/contacts?device=${device}`);
export const findContact = (name) => call('/api/contacts/find', { device, name });
export const saveContact = (contact) => call('/api/contacts', { device, ...contact });
export const suggest = (data) => call('/api/suggestion', { device, ...data });
export const driveFiles = () => call('/api/drive/files');
export const driveCheck = () => call(`/api/drive/check?device=${device}`);
export const driveUpload = (name) => call('/api/drive/upload', { device, name });
export const waFind = (name) => call('/api/whatsapp/find', { device, name });
export const waSave = (name, phone) => call('/api/whatsapp/contacts', { device, name, phone });
export const waLink = (phone, text) => call('/api/whatsapp/link', { device, phone, text });
export const connectUrl = () => `${location.origin}/auth/google?device=${device}`;
