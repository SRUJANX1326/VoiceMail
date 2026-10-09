// Structured voice-first email workflow. Drafting only begins after the user gives a subject and body instructions.
import { normalizeSpokenEmail, spellEmail } from './emailNormalize.js';
import { extractSpokenPhone, spellDigits } from './phoneNormalize.js';

const YES = /\b(yes|yeah|yep|yup|yea|sure|absolutely|correct|right|that's right|that is right|sounds good|works for me|that works|that would work|go ahead|go for it|please do|do that|save it|send it|let's do it|sounds like a plan|ok(?:ay)?|fine|haan|ha|sure thing|of course)\b/i;
const NO = /\b(no|nope|nah|not really|not correct|that's wrong|that is wrong|don't|dont|do not|not now|not yet|rather not|prefer not|don't think so|skip|leave it|leave it out|never mind|nahi)\b/i;
const CANCEL = /\b(cancel|abort|discard|forget it|never ?mind|stop the email)\b/i;
const CHANGE_REQUEST = /\b(add|change|make|remove|rewrite|shorter|longer|tone|subject|body|edit|revise|include|leave out|update)\b/i;
const NOTHING = /\b(no|nope|nah|nothing|fine|good|looks good|that's all|that is all|all good|perfect|it's fine|leave it|no changes|nothing else)\b/i;
const SEND_VERB = /\b(write|send|compose|draft|create|make|type|prepare)\b/i;
const MAIL = /\b(e-?mail|mail|message)\b/i;
const UPLOAD = /\b(upload|save|put|back ?up)\b[^.]*\b(drive|file|report|document)\b|\b(drive|google drive)\b[^.]*\bupload\b|\bupload\b/i;
const FILE_EXT = 'txt|text|md|csv|pdf|docx|xlsx|png|jpe?g';
// "report dot t x t" / "report.txt" / "report dot text" -> report.txt
export function spokenFileName(text) {
  const t = String(text).toLowerCase().replace(/\b(dot|period|full stop)\b/g, '.').replace(/\s*\.\s*/g, '.');
  const m = t.match(/([a-z0-9_-]+)\.((?:[a-z]\s?){2,4})\b/);
  if (!m) return null;
  let ext = m[2].replace(/\s/g, '');
  if (!new RegExp(`^(${FILE_EXT})$`).test(ext)) return null;
  if (ext === 'text') ext = 'txt';
  return `${m[1]}.${ext}`;
}
const spokenName = (n) => n.replace(/\./g, ' dot ');
const WHATSAPP = /\b(whats ?app|what'?s ?app|watsapp)\b/i;
const WA_CANCEL = /\b(cancel|abort|discard|forget it|never ?mind|stop)\b/i;
const WA_MSG = /\b(?:that|saying|says?|tell (?:him|her|them)(?: that)?|and say|to say|the message is|message is)\b\s*(.*)$/i;
const WA_FILLER = /\b(whats ?app|what'?s ?app|watsapp|send|write|type|drop|shoot|a|an|the|my|message|msg|text|on|to|please|hey|can you|could you|i want to|i want you to|want to|would like to|and|for|via|through|using|in)\b/gi;
const cleanMessage = (s) => { const t = String(s || '').replace(/^(that|to)\s+/i, '').trim(); if (!t) return ''; const c = t[0].toUpperCase() + t.slice(1); return /[.!?]$/.test(c) ? c : c + '.'; };
const waName = (s) => String(s).replace(WA_FILLER, ' ').replace(/[,.!?]/g, ' ').replace(/\s+/g, ' ').trim();
/** "message Rahul on WhatsApp that I'll be late" -> { name:'Rahul', phone:null, message:"I'll be late." } */
export function parseWhatsapp(text) {
  const m = text.match(WA_MSG);
  const head = m ? text.slice(0, m.index) : text;
  const ph = extractSpokenPhone(head);
  return { name: waName(ph ? ph.rest : head), phone: ph ? ph.phone : null, message: cleanMessage(m ? m[1] : '') };
}
const VALID = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const oneLine = (s) => String(s || '').replace(/\s*\n+\s*/g, ' ').trim();
const hasYes = (t) => YES.test(t);
const hasNo = (t) => NO.test(t);
const isYes = (t) => hasYes(t) && !hasNo(t);
const isNo = (t) => hasNo(t) && !hasYes(t);
const cleanName = (s) => String(s || '').replace(/[,.!?]/g, ' ').replace(/\b(yes|yeah|yep|yup|no|nope|nah|please|the contact is|the person is|person is|it's|it is|that would work|that works for me|sounds good|sure thing|of course|absolutely|the person|here are|here is|his details|her details|their details|details|his|her|their|contact|email address|his name is|her name is|their name is|name is|saved contact is|already saved|in my contacts|is saved|saved|he is|she is|they are|i want to email|i want to write to|want to email|want to write to|write to|send to|email)\b/ig, ' ').replace(/\band\s*$/i, ' ').replace(/^\s*and\s+|\s+and\s*$/ig, ' ').replace(/\s+/g, ' ').trim();

export class Dialog {
  constructor(api) { this.api = api; this.history = []; this.reset(); }
  reset() { this.state = 'idle'; this.draft = null; this.recipientOk = false; this.contact = null; this.contactName = ''; this.emailHistory = []; this.bodyInstruction = ''; this.subjectInstruction = ''; this.suggestion = ''; this.upload = null; this.driveFiles = []; this.wa = null; this.misses = 0; this.lastQ = ''; }
  get awaitingConfirmation() { return ['wa_confirm_phone','wa_confirm','confirm_upload','check_contact','save_contact','confirm_recipient','suggestion','confirm_send'].includes(this.state); }
  get expectsEmail() { return ['new_contact_details','confirm_recipient','review','adding','confirm_send'].includes(this.state); }
  cancelWa() { this.reset(); return this.out("Okay, I won't open WhatsApp. Nothing was sent."); }

  async startWhatsapp(text) {
    const p = parseWhatsapp(text);
    this.wa = { name: p.name, phone: p.phone, display: p.name, message: p.message, url: null };
    if (p.phone) return this.waAskPhone(p.phone);
    if (!p.name) { this.state = 'wa_need_name'; return this.out('Who should I message on WhatsApp?'); }
    return this.waLookup(p.name);
  }

  waAskPhone(phone) {
    this.wa.phone = phone; this.wa.saved = false; this.state = 'wa_confirm_phone';
    return this.out(`I heard ${phone}. Is that correct?`, `I heard ${spellDigits(phone)}. Is that correct?`);
  }

  async waLookup(name) {
    const r = await this.api.waFind(name);
    if (r.contact) { Object.assign(this.wa, { name: r.contact.name, phone: r.contact.phone, display: r.contact.name, saved: true }); return this.waNext(); }
    if (r.contacts && r.contacts.length > 1) { this.wa.options = r.contacts; this.state = 'wa_pick'; return this.out(`I have ${r.contacts.map((c) => c.name).join(', ')}. Which one?`); }
    this.wa.name = name; this.wa.display = name; this.state = 'wa_need_phone';
    return this.out(`I don't have a WhatsApp number for ${name}. Please say their number.`);
  }

  async waNext() {
    if (!this.wa.message) { this.state = 'wa_need_text'; return this.out(`What should the message to ${this.wa.display || 'them'} say?`); }
    let r;
    try { r = await this.api.waLink(this.wa.phone, this.wa.message); }
    catch (e) { this.state = 'wa_need_phone'; return this.out(`${e.message} Please say the number again.`); }
    this.wa.url = r.url; this.wa.e164 = r.display; this.state = 'wa_confirm'; // only a link is prepared here; nothing opens until the user says yes
    const who = this.wa.display && this.wa.display !== r.display ? `${this.wa.display} at ${r.display}` : r.display;
    return this.out(`WhatsApp to ${who}: "${this.wa.message}" Shall I open WhatsApp?`,
      `WhatsApp to ${this.wa.display || 'this number'}, ${spellDigits(r.display)}. The message says: ${this.wa.message} Shall I open WhatsApp?`);
  }

  async checkDrive() {
    const r = await this.api.driveCheck();
    if (!r.connected) return this.out('Google is not connected yet. Tap Connect Google first.');
    if (r.gmailPermission === false) return this.out('The Gmail permission box was not ticked. Tap Connect Google again and tick all the boxes.');
    if (r.drivePermission === false) return this.out('The Drive permission box was not ticked. Tap Connect Google again and tick the Drive box.');
    if (r.driveApi !== 'ok') return this.out(`Your permissions are fine, but Google Drive says: ${r.driveApi}`);
    return this.out('Everything is set up. Gmail and Drive permissions are granted, and Google Drive is responding.');
  }

  cancelUpload() { this.reset(); return this.out("Okay, I won't upload anything."); }

  async startUpload(text) {
    const r = await this.api.driveFiles();
    this.driveFiles = r.files || [];
    const named = spokenFileName(text);
    if (named) return this.pickFile(named);
    return this.pickFile(text);
  }

  async pickFile(text) {
    const files = this.driveFiles;
    const named = spokenFileName(text);
    const t = text.toLowerCase();
    if (!files.length) { this.reset(); return this.out('I could not find any uploadable files in the project folder.'); }
    let match = named && files.find((f) => f.name.toLowerCase() === named);
    if (named && !match) {
      this.state = 'choose_file';
      return this.out(`I could not find ${named} in the project folder. I can see ${files.map((f) => f.name).join(', ')}. Which one?`,
        `I could not find ${spokenName(named)} in the project folder. I can see ${files.map((f) => spokenName(f.name)).join(', ')}. Which one?`);
    }
    if (!match) {
      const hits = files.filter((f) => t.includes(f.name.replace(/\.[^.]+$/, '').toLowerCase()));
      if (hits.length === 1) match = hits[0];
      else if (files.length === 1) match = files[0];
    }
    if (!match) {
      this.state = 'choose_file';
      return this.out(`Which file? I can see ${files.map((f) => f.name).join(', ')}.`, `Which file? I can see ${files.map((f) => spokenName(f.name)).join(', ')}.`);
    }
    this.upload = match; this.state = 'confirm_upload';
    return this.out(`Upload ${match.name} (${match.sizeLabel}) to your Google Drive folder Voice Mail Assistant. Shall I go ahead?`,
      `Upload ${spokenName(match.name)}, ${match.sizeLabel}, to your Google Drive. Shall I go ahead?`);
  }

  async doUpload() {
    if (this.state !== 'confirm_upload' || !this.upload) return this.cancelUpload(); // never upload without confirmation
    const f = this.upload;
    this.state = 'uploading';
    try {
      const r = await this.api.driveUpload(f.name);
      this.reset();
      return this.out(`Done. ${f.name} is now in your Google Drive.`, `Done. ${spokenName(f.name)} is now in your Google Drive.`, { uploaded: true, name: f.name, link: r.link });
    } catch (e) {
      this.state = 'confirm_upload';
      return this.out(`Sorry, the upload failed. ${e.message} Say yes to try again, or cancel.`);
    }
  }

  reprompt() { return this.lastQ || 'Sorry, I did not catch that. Could you say it another way?'; }
  out(say, speech, extra = {}) { this.lastQ = speech || say; return { say, speech: speech || say, state: this.state, sent: false, ...extra }; }
  cancel() { this.reset(); return this.out('No problem. I cancelled the email, and nothing was sent.'); }

  async handle(input) {
    const alts = (Array.isArray(input?.alts) && input.alts.length ? input.alts : [typeof input === 'string' ? input : input?.text || '']).filter(Boolean);
    let text = (alts[0] || '').trim();
    if (this.expectsEmail) text = (alts.find((a) => normalizeSpokenEmail(a).email) || text).trim();
    const n = normalizeSpokenEmail(text);
    const lower = text.toLowerCase();

    switch (this.state) {
      case 'idle': {
        if (WHATSAPP.test(text)) return this.startWhatsapp(text);
        if (/\b(check|test|verify)\b[^.]*\b(drive|google)\b[^.]*\b(permission|permissions|access|connection|setup)\b/i.test(text)) return this.checkDrive();
        if (UPLOAD.test(text) && !MAIL.test(text)) return this.startUpload(text);
        if ((SEND_VERB.test(text) && MAIL.test(text)) || (n.email && MAIL.test(text))) return this.startEmail();
        const r = await this.api.chat(n.text, this.history);
        if (r.intent === 'email') return this.startEmail();
        this.history.push({ role: 'user', text: n.text }, { role: 'assistant', text: r.reply });
        return this.out(r.reply);
      }
      case 'wa_need_name': {
        if (WA_CANCEL.test(text)) return this.cancelWa();
        const ph = extractSpokenPhone(text);
        if (ph) return this.waAskPhone(ph.phone);
        const nm = waName(text);
        return nm ? this.waLookup(nm) : this.out('Sorry, who should I message?');
      }
      case 'wa_pick': {
        if (WA_CANCEL.test(text)) return this.cancelWa();
        const q = text.toLowerCase();
        const hit = this.wa.options.filter((c) => c.name.toLowerCase().split(/\s+/).some((w) => w.length > 1 && q.includes(w)));
        if (hit.length === 1) { Object.assign(this.wa, { name: hit[0].name, phone: hit[0].phone, display: hit[0].name, saved: true }); return this.waNext(); }
        return this.out(`Please say which one: ${this.wa.options.map((c) => c.name).join(', ')}.`);
      }
      case 'wa_need_phone': {
        if (WA_CANCEL.test(text)) return this.cancelWa();
        const ph = extractSpokenPhone(text);
        return ph ? this.waAskPhone(ph.phone) : this.out('I did not catch a number. Please say all the digits, for example nine eight seven six five, four three two one zero.');
      }
      case 'wa_confirm_phone': {
        if (WA_CANCEL.test(text)) return this.cancelWa();
        const ph = extractSpokenPhone(text);
        if (ph && ph.phone !== this.wa.phone) return this.waAskPhone(ph.phone); // "no, it is ..."
        if (isYes(text)) {
          if (this.wa.name && !this.wa.saved) { try { await this.api.waSave(this.wa.name, this.wa.phone); this.wa.saved = true; } catch { /* saving is optional */ } }
          return this.waNext();
        }
        if (isNo(text)) { this.state = 'wa_need_phone'; return this.out('Sorry about that. Please say the number again.'); }
        return this.out(`Please say yes or no. Is ${this.wa.phone} correct?`, `Please say yes or no. Is ${spellDigits(this.wa.phone)} correct?`);
      }
      case 'wa_need_text': {
        if (WA_CANCEL.test(text)) return this.cancelWa();
        this.wa.message = cleanMessage(text.replace(/^(say|tell (him|her|them)|write)\s+/i, ''));
        return this.waNext();
      }
      case 'wa_confirm': {
        if (WA_CANCEL.test(text)) return this.cancelWa();
        if (isYes(text)) {
          const { url, display } = this.wa;
          this.reset();
          return this.out(`Opening WhatsApp for ${display}. Tap Send there to deliver the message.`, undefined, { whatsapp: true, openUrl: url, to: display });
        }
        if (isNo(text)) { this.state = 'wa_need_text'; return this.out('Okay. What should the message say instead?'); }
        return this.out('Please say yes to open WhatsApp, no to change the message, or cancel.');
      }
      case 'choose_file': {
        if (CANCEL.test(text) || /\b(stop|never ?mind|forget)\b/i.test(text)) return this.cancelUpload();
        return this.pickFile(text);
      }
      case 'confirm_upload': {
        if (CANCEL.test(text) || /\b(stop|never ?mind|forget)\b/i.test(text)) return this.cancelUpload();
        if (isYes(text)) return this.doUpload();
        if (isNo(text)) return this.cancelUpload();
        return this.out(`Please say yes or no. Upload ${this.upload.name} to Google Drive?`, `Please say yes or no. Upload ${spokenName(this.upload.name)} to Google Drive?`);
      }
      case 'check_contact': {
        if (CANCEL.test(text)) return this.cancel();
        if (isYes(text) || /\b(saved|in my contacts|already have)\b/i.test(text)) {
          const name = cleanName(text.replace(/\b(yes|yeah|yep|yup|sure|okay|ok|the person is|it's|it is|saved|in my contacts|already have)\b/ig, ' '));
          if (name && name.length > 1) return this.lookupContact(name);
          this.state = 'choose_saved_contact';
          return this.out('Great. What is their name? You can say their first or full name.');
        }
        if (isNo(text) || /\b(not saved|new contact|not in my contacts)\b/i.test(text)) {
          this.state = 'new_contact_details';
          if (n.email) return this.collectNewContact(text, n);
          return this.out('No problem. Tell me their name and email address. You can say both in one sentence.');
        }
        return this.out('I can work with that. Is the person already saved in your contacts, or are they a new contact?');
      }
      case 'choose_saved_contact': {
        if (CANCEL.test(text)) return this.cancel();
        const name = cleanName(text);
        if (!name) return this.out('What name should I look for in your saved contacts?');
        return this.lookupContact(name);
      }
      case 'new_contact_details': {
        if (CANCEL.test(text)) return this.cancel();
        return this.collectNewContact(text, n);
      }
      case 'save_contact': {
        if (CANCEL.test(text)) return this.cancel();
        if (isYes(text)) {
          await this.api.saveContact(this.contact);
          const r = this.setRecipient(this.contact.email); r.say = `Saved ${this.contact.name}. ` + r.say; return r;
        }
        if (isNo(text)) { const r = this.setRecipient(this.contact.email); r.say = 'Okay, I will use the contact without saving it. ' + r.say; return r; }
        return this.out(`Would you like me to save ${this.contact.name} for next time? You can say “sounds good” or “not now.”`);
      }
      case 'subject': {
        if (CANCEL.test(text)) return this.cancel();
        if (text.length < 2) return this.out('What should the email be about? You can say the subject or describe the whole situation in your own words.');
        this.subjectInstruction = text;
        if (text.length >= 55 || /\b(i am writing|i want to tell|the reason|because|will not be|won.t be|vacation|absence|requesting|please let|formal email|inform you)\b/i.test(text)) {
          this.bodyInstruction = text;
          this.subjectInstruction = '';
          return this.createDraft();
        }
        this.state = 'body_instruction';
        return this.out('Got it. Now tell me what you want the email to communicate, including any reason, requested action, and tone. I will use what you have already told me, so you do not need to repeat it.');
      }
      case 'body_instruction': {
        if (CANCEL.test(text)) return this.cancel();
        if (text.trim().split(/\s+/).length < 4) return this.out(`I have your earlier details: ${this.subjectInstruction}. Could you add one sentence about what you want the recipient to know or do?`);
        this.bodyInstruction = text;
        return this.createDraft();
      }
      case 'confirm_recipient': {
        if (CANCEL.test(text)) return this.cancel();
        if (n.email && n.email !== this.draft.to) return this.setRecipient(n.email);
        if (isYes(text)) { this.recipientOk = true; return this.askSubject('Recipient confirmed.'); }
        if (isNo(text)) { this.state = 'new_contact_details'; return this.out('No problem. Please tell me the correct name and email address.'); }
        return this.out(`I heard ${this.draft.to}. Does that look right? You can say “yep, that's right” or tell me the correction.`, `I heard ${spellEmail(this.draft.to)}. Does that look right? You can say yep, that's right, or tell me the correction.`);
      }
      case 'suggestion': {
        if (CANCEL.test(text)) return this.cancel();
        if (isYes(text)) { this.draft.body = `${this.draft.body.trim()}\n\n${this.suggestion}`; this.state = 'review'; return this.readDraft('I added that suggestion.'); }
        if (isNo(text)) { this.state = 'review'; return this.readDraft('No problem, I left it out.'); }
        return this.out(`I suggested: ${this.suggestion}. Would you like me to include that?`);
      }
      case 'review':
      case 'adding': {
        if (CANCEL.test(text)) return this.cancel();
        if (n.email && n.email !== this.draft.to) return this.setRecipient(n.email);
        if (this.state === 'review' && NOTHING.test(lower) && !/\b(add|change|make|remove|rewrite|shorter|longer|tone|subject)\b/i.test(text)) return this.askSend();
        if (this.state === 'review' && isYes(text) && text.split(/\s+/).length <= 8 && !CHANGE_REQUEST.test(text)) return this.askSend();
        return this.edit(text);
      }
      case 'confirm_send': {
        if (CANCEL.test(text)) return this.cancel();
        if (n.email && n.email !== this.draft.to) return this.setRecipient(n.email);
        if (CHANGE_REQUEST.test(text) && /\b(but|also|actually|first|instead|change|add|edit|revise|update)\b/i.test(text)) { this.state = 'adding'; return this.edit(text); }
        if (isYes(text)) return this.send();
        if (isNo(text)) { this.state = 'adding'; return this.out('Absolutely, I will not send it. What would you like me to change? You can also say “cancel email.”'); }
        return this.out(`Ready to send this email to ${this.draft.to}. Does that sound good? Say something like “yep, send it” to confirm, or tell me what you want to change.`);
      }
      default: return this.out('Let’s start again. What would you like me to help you with?', undefined, this.reset());
    }
  }

  async startEmail() {
    this.reset();
    this.state = 'check_contact';
    return this.out('Of course. Is the person you want to email already saved in your contacts?');
  }
  async lookupContact(name) {
    const result = await this.api.findContact(name);
    if (result?.contact) {
      this.contact = result.contact;
      this.contactName = result.contact.name;
      this.emailHistory = result.history || [];
      this.draft = { to: result.contact.email, subject: '', body: '' };
      this.state = 'confirm_recipient';
      return this.out(`I found ${result.contact.name}, ${result.contact.email}. Is this the right person?`);
    }
    const options = result?.contacts || [];
    if (options.length) { this.state = 'choose_saved_contact'; return this.out(`I couldn't find an exact match for ${name}. I found ${options.slice(0,3).map(c => `${c.name}, ${c.email}`).join('; ')}. Please say the name you want, or say “new contact.”`); }
    this.state = 'new_contact_details';
    return this.out(`I couldn't find ${name} in your saved contacts. Please tell me their name and email address, and I can use them for this email.`);
  }
  collectNewContact(text, n) {
    if (!n.email) return this.out('I got the name, but not a complete email address. Please say their email, for example, alex at gmail dot com.');
    const before = n.text.includes(n.email) ? n.text.slice(0, n.text.indexOf(n.email)) : text;
    const name = cleanName(before.replace(/\b(no|new contact|their email is|email is|address is|it's|it is|name is|please|send an email to|at|gmail|outlook|yahoo|dot|com)\b/ig, ' '));
    this.contactName = name || n.email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    this.contact = { name: this.contactName, email: n.email };
    this.state = 'save_contact';
    return this.out(`I have ${this.contactName}, ${this.contact.email}. Would you like me to save this contact for next time?`);
  }
  askSubject(prefix = '') { this.state = 'subject'; return this.out(`${prefix ? prefix + ' ' : ''}What should the subject be? Tell me the subject in your own words.`); }
  setRecipient(email) {
    this.contact = { name: this.contactName || email.split('@')[0], email };
    this.draft = { to: email, subject: '', body: '' }; this.recipientOk = false; this.state = 'confirm_recipient';
    return this.out(`I heard ${email}. Is that the correct email address?`, `I heard ${spellEmail(email)}. Is that the correct email address?`);
  }
  async createDraft() {
    const current = { to: this.contact?.email || this.draft?.to || '', recipientName: this.contact?.name || '', subjectInstruction: this.subjectInstruction, bodyInstruction: this.bodyInstruction, history: this.emailHistory };
    this.draft = await this.api.draft(this.bodyInstruction, current);
    this.draft.to = current.to;
    // The model should infer a suitable subject from the user's full instructions when no subject was explicitly given.
    if (!this.draft.subject) this.draft.subject = this.subjectInstruction;
    if (!this.draft.body) { this.state = 'body_instruction'; return this.out('I need a little more detail to write the email. What would you like the message to say?'); }
    const history = this.emailHistory.filter((h) => h.subject || h.body);
    if (history.length && this.api.suggest) {
      const s = await this.api.suggest({ name: this.contact?.name, email: this.contact?.email, subject: this.subjectInstruction, bodyInstruction: this.bodyInstruction, history });
      if (s?.suggestion) { this.suggestion = s.suggestion; this.state = 'suggestion'; return this.out(`I drafted the email. Based on your past emails with ${this.contact?.name || 'this person'}, I have one optional suggestion: ${this.suggestion}. Would you like me to include it?`); }
    }
    this.state = 'review';
    return this.readDraft('Here is a draft based on what you told me.');
  }
  readDraft(prefix = '') {
    const d = this.draft;
    return this.out(`${prefix} Subject: ${d.subject}. ${oneLine(d.body)} Would you like to change anything, or does it look good?`);
  }
  async edit(instruction) {
    const to = this.draft.to;
    const updated = await this.api.draft(instruction, { ...this.draft, to, recipientName: this.contact?.name || '', history: this.emailHistory, subjectInstruction: this.subjectInstruction, bodyInstruction: this.bodyInstruction });
    this.draft = { ...updated, to };
    this.state = 'review';
    return this.readDraft('I updated the draft.');
  }
  askSend() {
    this.state = 'confirm_send';
    return this.out(`Would you like me to send this email to ${this.draft.to}? Nothing will be sent unless you confirm.`);
  }
  async send() {
    if (this.state !== 'confirm_send' || !this.recipientOk || !VALID.test(this.draft?.to || '') || !this.draft?.subject?.trim() || !this.draft?.body?.trim()) return this.cancel();
    const d = this.draft; this.state = 'sending';
    try { await this.api.send({ to: d.to, subject: d.subject, body: d.body, contactName: this.contact?.name || '' }); }
    catch (e) { this.state = 'confirm_send'; return this.out(`Sorry, sending failed. ${e.message}. You can say “try again” or cancel.`); }
    this.reset();
    return this.out(`Email sent to ${d.to}.`, undefined, { sent: true, to: d.to });
  }
}
