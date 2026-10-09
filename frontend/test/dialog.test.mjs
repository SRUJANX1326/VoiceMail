import test from 'node:test';
import assert from 'node:assert/strict';
import { Dialog } from '../src/dialog.js';

function make({ contacts = [], history = [] } = {}) {
  const sent = [], saved = [], draftCalls = [];
  const api = {
    chat: async () => ({ intent: 'chat', reply: 'Hi there.' }),
    findContact: async (name) => {
      const c = contacts.find(x => x.name.toLowerCase().includes(name.toLowerCase()));
      return c ? { contact: c, history } : { contact: null, contacts: [] };
    },
    saveContact: async (c) => { saved.push(c); },
    draft: async (t, cur) => { draftCalls.push({t, cur}); return { to: cur?.to || '', subject: cur?.subjectInstruction || 'AI-generated subject from instructions', body: `AI-written email based on: ${cur?.bodyInstruction || t}. `.repeat(20).trim() }; },
    suggest: async () => ({ suggestion: '' }),
    send: async (m) => { sent.push(m); },
  };
  return { d: new Dialog(api), sent, saved, draftCalls };
}

async function reachBodyStep(d, contactDetails = 'no') {
  await d.handle('write an email');
  await d.handle(contactDetails);
  if (d.state === 'new_contact_details') await d.handle('Alex Example, alex@example.com');
  if (d.state === 'save_contact') await d.handle('not now, thanks');
  if (d.state === 'confirm_recipient') await d.handle('yep, that would work');
  return d;
}

test('email request asks if recipient is saved before drafting anything', async () => {
  const { d, draftCalls } = make();
  const r = await d.handle('write an email');
  assert.match(r.say, /already saved in your contacts/i);
  assert.equal(d.state, 'check_contact');
  assert.equal(draftCalls.length, 0);
  assert.equal(d.draft, null);
});

test('natural affirmative and negative phrases work', async () => {
  const { d } = make();
  await d.handle('write an email');
  assert.equal((await d.handle('Yep, that would work')).state, 'choose_saved_contact');
  assert.match((await d.handle('No, I mean this is a new contact')).say, /couldn't find/i);
});

test('new contact can be used without Supabase and optionally saved', async () => {
  const { d, saved } = make();
  await d.handle('write an email');
  await d.handle('no');
  const r = await d.handle('Alex Example, alex@example.com');
  assert.equal(d.state, 'save_contact');
  assert.match(r.say, /save this contact/i);
  await d.handle('Yep, that would work');
  assert.equal(saved.length, 1);
  assert.equal(saved[0].email, 'alex@example.com');
  assert.equal(d.state, 'confirm_recipient');
  await d.handle('Yep, that would work');
  assert.equal(d.state, 'subject');
});

test('does not draft until user has given subject and body instructions', async () => {
  const { d, draftCalls } = make();
  await reachBodyStep(d);
  assert.equal(d.state, 'subject');
  assert.equal(draftCalls.length, 0);
  await d.handle('Request to reschedule our meeting');
  assert.equal(d.state, 'body_instruction');
  assert.equal(draftCalls.length, 0);
  await d.handle('Ask if we can move our meeting to next week because I have a schedule conflict. Be polite and ask them to share a convenient time.');
  assert.equal(draftCalls.length, 1);
  assert.equal(d.state, 'review');
  assert.match(d.draft.subject, /Request to reschedule/);
  assert.match(d.draft.body, /AI-written email/);
});

test('saved contact is looked up, confirmed with natural language, then asks subject', async () => {
  const { d, draftCalls } = make({ contacts: [{ name: 'Alex Example', email: 'alex@example.com' }] });
  await d.handle('write an email');
  await d.handle('yes, Alex Example');
  assert.equal(d.state, 'confirm_recipient');
  await d.handle('Correct, looks good');
  assert.equal(d.state, 'subject');
  assert.equal(draftCalls.length, 0);
});

test('recipient confirmation supports correction and never sends early', async () => {
  const { d, sent } = make();
  await d.handle('write an email'); await d.handle('no'); await d.handle('Alex Example, alex@example.com'); await d.handle('not now');
  await d.handle('yep, that would work');
  assert.equal(d.state, 'subject');
  assert.equal(sent.length, 0);
});

test('review and final send accepts conversational confirmation but requires explicit confirmation', async () => {
  const { d, sent } = make();
  await reachBodyStep(d);
  await d.handle('Request for an update');
  await d.handle('Ask them to send me the status update by Friday. Keep it friendly and professional.');
  await d.handle('Looks good, that works for me');
  assert.equal(d.state, 'confirm_send');
  assert.equal(sent.length, 0);
  const result = await d.handle('Yep, go ahead and send it');
  assert.equal(result.sent, true);
  assert.equal(sent.length, 1);
});

test('declining final send does not send', async () => {
  const { d, sent } = make();
  await reachBodyStep(d);
  await d.handle('Request for an update');
  await d.handle('Ask them to send me the status update by Friday. Keep it friendly and professional.');
  await d.handle('Looks good');
  await d.handle('No, not now');
  assert.equal(sent.length, 0);
  assert.equal(d.state, 'adding');
});

test('normal chat still works', async () => {
  const { d } = make();
  assert.equal((await d.handle('tell me a joke')).say, 'Hi there.');
});


test('long natural description given at the subject prompt is reused instead of asking the user to repeat it', async () => {
  const { d, draftCalls } = make();
  await reachBodyStep(d);
  const longDescription = 'I am writing an email to my boss that I will not be coming to the office next week because I am going on vacation to the North Pole. Please make it formal.';
  const result = await d.handle(longDescription);
  assert.equal(draftCalls.length, 1);
  assert.equal(d.state, 'review');
  assert.equal(d.bodyInstruction, longDescription);
  assert.match(result.say, /draft/i);
});

test('a short fragment is not treated as complete email instructions', async () => {
  const { d, draftCalls } = make();
  await reachBodyStep(d);
  await d.handle('Request for leave');
  const result = await d.handle('not be');
  assert.equal(draftCalls.length, 0);
  assert.match(result.say, /add one sentence/i);
});
