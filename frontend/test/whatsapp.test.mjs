import test from 'node:test';
import assert from 'node:assert/strict';
import { Dialog, parseWhatsapp } from '../src/dialog.js';
import { extractSpokenPhone, spellDigits } from '../src/phoneNormalize.js';

test('spoken phone numbers', () => {
  const t = (s) => extractSpokenPhone(s)?.phone ?? null;
  assert.equal(t('nine eight seven six five four three two one zero'), '9876543210');
  assert.equal(t('my number is 98765 43210 thanks'), '9876543210');
  assert.equal(t('plus nine one nine eight seven six five four three two one zero'), '+919876543210');
  assert.equal(t('+91 98765-43210'), '+919876543210');
  assert.equal(t('nine eight double seven six five four three two one'), '9877654321');
  assert.equal(t('call me at 5 30'), null);
  assert.equal(t('oh 98765 43210 oh'), '9876543210');
  assert.equal(spellDigits('+919'), 'plus, 9, 1, 9');
});

test('parseWhatsapp splits recipient and message', () => {
  assert.deepEqual(parseWhatsapp("message Rahul on WhatsApp that I'll be late"), { name: 'Rahul', phone: null, message: "I'll be late." });
  assert.deepEqual(parseWhatsapp('send a WhatsApp message to my boss saying see you tomorrow'), { name: 'boss', phone: null, message: 'See you tomorrow.' });
  assert.equal(parseWhatsapp('whatsapp 98765 43210 that I am on my way').phone, '9876543210');
  assert.equal(parseWhatsapp('send a whatsapp').name, '');
  // a number inside the MESSAGE must not become the recipient
  const p = parseWhatsapp('message Rahul on whatsapp that my order number is 12345678');
  assert.equal(p.phone, null); assert.equal(p.name, 'Rahul');
});

function make({ contacts = [{ name: 'Rahul', phone: '919876543210' }] } = {}) {
  const calls = { saved: [], links: [] };
  const api = {
    chat: async () => ({ intent: 'chat', reply: 'Hi there.' }),
    waFind: async (name) => {
      const q = name.toLowerCase().split(/\s+/);
      const hits = contacts.filter((c) => c.name.toLowerCase().split(/\s+/).every((w) => q.includes(w)) || q.every((w) => c.name.toLowerCase().includes(w)));
      return { contact: hits.length === 1 ? hits[0] : null, contacts: hits };
    },
    waSave: async (name, phone) => { calls.saved.push({ name, phone }); },
    waLink: async (phone, text) => { const d = phone.replace(/\D/g, ''); const full = d.length === 10 ? '91' + d : d; calls.links.push({ phone, text }); return { url: `https://wa.me/${full}?text=${encodeURIComponent(text)}`, display: '+' + full }; },
  };
  return { d: new Dialog(api), calls };
}

test('saved contact: asks to confirm, opens WhatsApp ONLY after yes', async () => {
  const { d } = make();
  const r1 = await d.handle("message Rahul on WhatsApp that I'll be late");
  assert.equal(d.state, 'wa_confirm'); assert.equal(d.awaitingConfirmation, true);
  assert.match(r1.say, /Rahul at \+919876543210.*I'll be late\..*Shall I open WhatsApp/);
  assert.equal(r1.openUrl, undefined);
  const r2 = await d.handle('yes');
  assert.equal(r2.whatsapp, true);
  assert.equal(r2.openUrl, "https://wa.me/919876543210?text=I'll%20be%20late.".replace("'", encodeURIComponent("'")) );
  assert.equal(d.state, 'idle');
});

test('rejecting or cancelling never opens WhatsApp', async () => {
  const { d } = make();
  await d.handle('message Rahul on whatsapp that hello');
  const no = await d.handle('no');
  assert.equal(no.openUrl, undefined); assert.equal(d.state, 'wa_need_text');
  assert.equal((await d.handle('see you at five')).state, 'wa_confirm');
  const c = await d.handle('cancel');
  assert.equal(c.openUrl, undefined); assert.equal(d.state, 'idle');
});

test('unclear answers never open WhatsApp', async () => {
  const { d } = make();
  await d.handle('message Rahul on whatsapp that hello');
  const r = await d.handle('hmm what');
  assert.equal(r.openUrl, undefined); assert.equal(d.state, 'wa_confirm');
});

test('unknown contact: asks for number, reads it back, saves after confirmation, then confirms message', async () => {
  const { d, calls } = make({ contacts: [] });
  assert.match((await d.handle('whatsapp Priya that I reached home')).say, /don't have a WhatsApp number for Priya/);
  const heard = await d.handle('nine eight seven six five four three two one zero');
  assert.equal(heard.say, 'I heard 9876543210. Is that correct?');
  assert.equal(calls.saved.length, 0);                       // nothing saved before confirmation
  const next = await d.handle('yes');
  assert.deepEqual(calls.saved, [{ name: 'Priya', phone: '9876543210' }]);
  assert.match(next.say, /\+919876543210.*I reached home\./);
  assert.equal(d.state, 'wa_confirm');
  assert.equal((await d.handle('yes')).whatsapp, true);
});

test('wrong number heard: "no" then corrected number', async () => {
  const { d } = make({ contacts: [] });
  await d.handle('whatsapp Priya that hi');
  await d.handle('9876543210');
  assert.match((await d.handle('no')).say, /say the number again/);
  assert.equal((await d.handle('9123456789')).say, 'I heard 9123456789. Is that correct?');
  assert.equal(d.wa.phone, '9123456789');
});

test('missing message / missing name are asked for', async () => {
  const { d } = make();
  assert.match((await d.handle('send a whatsapp message to Rahul')).say, /What should the message to Rahul say/);
  assert.equal((await d.handle('tell him I am running late')).state, 'wa_confirm');
  const e = make();
  assert.match((await e.d.handle('send a whatsapp')).say, /Who should I message/);
});

test('two matching contacts: asks which one', async () => {
  const { d } = make({ contacts: [{ name: 'Rahul Sharma', phone: '911111111111' }, { name: 'Rahul Verma', phone: '922222222222' }] });
  assert.match((await d.handle('whatsapp Rahul that hi')).say, /Rahul Sharma, Rahul Verma. Which one/);
  assert.equal((await d.handle('the Verma one')).state, 'wa_confirm');
  assert.match(d.wa.url, /922222222222/);
});

test('invalid number from the server is reported and asked again', async () => {
  const { d } = make({ contacts: [] });
  d.api.waLink = async () => { throw new Error('That phone number does not look valid.'); };
  await d.handle('whatsapp 98765 43210 that hi'); await d.handle('yes');
  assert.match((await d.handle('yes')).say ?? '', /.*/);
});

test('email requests and normal chat are unaffected', async () => {
  const { d } = make();
  d.startEmail = async () => ({ say: 'email flow', speech: 'email flow' });
  assert.equal((await d.handle('write an email to my boss')).say, 'email flow');
  assert.equal((await d.handle('tell me a joke')).say, 'Hi there.');
});
