// Google Drive upload (free: Drive API needs no billing). Uses the narrow "drive.file" permission:
// the app can only see files/folders it created itself, never the rest of your Drive.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { client } from './gmail.js';

export const FOLDER_NAME = 'Voice Mail Assistant';
export const MAX_BYTES = 25 * 1024 * 1024;
const TYPES = {
  txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
};
// Files are taken ONLY from this folder (default: the project folder, next to backend/ and frontend/).
export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));

const ext = (n) => path.extname(n).slice(1).toLowerCase();
const fmt = (b) => (b < 1024 ? `${b} bytes` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);

export function listFiles(dir = uploadDir()) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith('.') && TYPES[ext(e.name)])
    .map((e) => ({ name: e.name, size: fs.statSync(path.join(dir, e.name)).size }))
    .filter((f) => f.size <= MAX_BYTES)
    .map((f) => ({ ...f, sizeLabel: fmt(f.size) }));
}

/** Validates a file name and returns its real path. Throws an Error with .status for bad input. */
export function resolveFile(name, dir = uploadDir()) {
  const bad = (status, msg) => Object.assign(new Error(msg), { status });
  const n = String(name || '');
  if (!n || n !== path.basename(n) || n.startsWith('.')) throw bad(400, 'Invalid file name.');
  if (!TYPES[ext(n)]) throw bad(400, `Files of type .${ext(n) || '?'} are not allowed.`);
  const full = path.join(dir, n);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) throw bad(404, `I could not find ${n} in the project folder.`);
  const { size } = fs.statSync(full);
  if (size > MAX_BYTES) throw bad(400, 'That file is larger than 25 MB.');
  return { path: full, name: n, size, sizeLabel: fmt(size), mimeType: TYPES[ext(n)] };
}

/** `drive` is a googleapis Drive v3 client (injectable so it can be tested without Google). */
export async function uploadToDrive(drive, file) {
  const q = `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`;
  const found = await drive.files.list({ q, fields: 'files(id,name)', spaces: 'drive', pageSize: 1 });
  let folderId = found.data.files?.[0]?.id;
  if (!folderId) {
    const made = await drive.files.create({ requestBody: { name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }, fields: 'id' });
    folderId = made.data.id;
  }
  const res = await drive.files.create({
    requestBody: { name: file.name, parents: [folderId] },
    media: { mimeType: file.mimeType, body: fs.createReadStream(file.path) },
    fields: 'id,name,webViewLink',
  });
  return { id: res.data.id, name: res.data.name, link: res.data.webViewLink, folder: FOLDER_NAME };
}

export function driveFor(refresh_token) {
  const auth = client();
  auth.setCredentials({ refresh_token });
  return google.drive({ version: 'v3', auth });
}

/** Turns Google errors into messages that are useful when spoken. */
export function friendlyDriveError(e) {
  const msg = String(e?.message || e);
  const status = e?.code || e?.status || e?.response?.status;
  if (/accessNotConfigured|has not been used in project|is disabled/i.test(msg)) return { status: 503, error: 'The Google Drive API is not enabled. Enable it in Google Cloud Console, wait a minute, then try again.' };
  if (/insufficient|scope|PERMISSION_DENIED/i.test(msg)) return { status: 403, error: 'Drive permission is missing. Remove the app at myaccount.google.com/permissions, then tap Connect Google again and tick the Drive box.' };
  if (status === 403) return { status: 403, error: `Google refused the upload: ${msg.slice(0, 160)}` }; // other 403s (quota, rate limit...) show Google's own reason
  if (/invalid_grant/.test(msg)) return { status: 401, error: 'Google connection expired. Please reconnect.' };
  return { status: 500, error: msg };
}
