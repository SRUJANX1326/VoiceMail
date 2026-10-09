import { google } from 'googleapis';

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.file', // upload files created by this app only
  'https://www.googleapis.com/auth/userinfo.email',
];

export const client = () =>
  new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

export const authUrl = (device) =>
  client().generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES, state: device });

export async function exchange(code) {
  const c = client();
  const { tokens } = await c.getToken(code);
  c.setCredentials(tokens);
  const { data } = await google.oauth2({ version: 'v2', auth: c }).userinfo.get();
  return { refresh_token: tokens.refresh_token, email: data.email, scope: tokens.scope || '' };
}

const b64url = (b) => Buffer.from(b).toString('base64url');

export function buildRaw(from, { to, subject, body }) {
  const mime = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(body).toString('base64'),
  ].join('\r\n');
  return b64url(mime);
}

export async function sendMail(refresh_token, from, mail) {
  const c = client();
  c.setCredentials({ refresh_token });
  await google.gmail({ version: 'v1', auth: c }).users.messages.send({ userId: 'me', requestBody: { raw: buildRaw(from, mail) } });
}
