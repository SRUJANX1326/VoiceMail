// Free voice layer: Android native SpeechRecognizer/TextToSpeech inside the app, browser Web Speech API on desktop.
export const native = typeof window.Android !== 'undefined';
const LANG = 'en-IN';

const S = { listenRes: null, partialCb: null, speakRes: null, rec: null, carry: null };
const fin = (v) => { const f = S.listenRes; S.listenRes = null; f && f(v); };

window.onNative = (type, data) => {
  if (type === 'result') {
    let alts;
    try { alts = JSON.parse(data); if (!Array.isArray(alts)) throw 0; } catch { alts = data ? [String(data)] : []; } // old app build sends plain text
    fin(alts.length ? { text: alts[0], alts } : null);
  }
  else if (type === 'partial') S.partialCb && S.partialCb(data);
  else if (type === 'error') { S.err && S.err('native-' + data); fin(null); }
  else if (type === 'tts') { if (data === 'error' || data === 'unavailable') S.err && S.err('tts-' + data); const f = S.speakRes; S.speakRes = null; f && f(); }
};

// ---------- listening ----------
function listenRaw() {
  if (native) {
    return new Promise((resolve) => {
      const t = setTimeout(() => { fin(null); window.Android.stopListening(); }, 20000);
      S.listenRes = (v) => { clearTimeout(t); resolve(v); };
      window.Android.listen();
    });
  }
  return new Promise((resolve) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { S.err && S.err('unsupported'); return resolve(null); }
    const r = new SR();
    let finished = false;
    const done = (v) => {                       // bound to THIS recognizer: a late onend from an old one can't cancel a new listen
      if (finished) return;
      finished = true;
      if (S.rec === r) S.rec = null;
      if (S.listenRes === done) S.listenRes = null;
      resolve(v);
    };
    S.rec = r; S.listenRes = done;
    r.lang = LANG; r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      if (res.isFinal) { const alts = [...res].map((a) => a.transcript.trim()); done({ text: alts[0], alts }); }
      else S.partialCb && S.partialCb(res[0].transcript);
    };
    r.onerror = (e) => { if (e && e.error && e.error !== 'no-speech' && e.error !== 'aborted') S.err && S.err(e.error); done(null); };
    r.onend = () => done(null);
    try { r.start(); } catch { done(null); }
  });
}

/** Resolves { text, alts } or null. Returns text carried over from a voice interruption first. */
export async function listen() {
  if (S.carry) { const c = S.carry; S.carry = null; return c; }
  return listenRaw();
}

export const onVoiceError = (cb) => { S.err = cb; };

export function abortListen() {
  fin(null);
  if (native) window.Android.stopListening(); else try { S.rec && S.rec.abort(); } catch {}
}

// ---------- speaking ----------
export function voices() { return window.speechSynthesis ? speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)) : []; }
export const getVoiceId = () => localStorage.getItem('voiceURI') || '';
export const setVoiceId = (id) => localStorage.setItem('voiceURI', id);

function bestVoice() {
  const all = voices();
  const saved = all.find((v) => v.voiceURI === getVoiceId());
  if (saved) return saved;
  const score = (v) =>
    (/en[-_]IN/i.test(v.lang) ? 3 : /en[-_](US|GB)/i.test(v.lang) ? 2 : 0) +
    (/natural|neural|online/i.test(v.name) ? 6 : 0) + (/google/i.test(v.name) ? 3 : 0) + (/microsoft/i.test(v.name) ? 2 : 0);
  return all.sort((a, b) => score(b) - score(a))[0] || null;
}

function speakRaw(text) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, 5000 + text.length * 120);
    const done = () => { clearTimeout(t); resolve(); };
    if (native) { S.speakRes = done; window.Android.speak(text); return; }
    if (!window.speechSynthesis) return done();
    speechSynthesis.cancel(); // clear any stuck queue
    const u = new SpeechSynthesisUtterance(text);
    window.__utterance = u;   // prevents Chrome from garbage-collecting it before onend fires
    const v = bestVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 1.03;
    u.onend = done; u.onerror = done;
    speechSynthesis.speak(u);
  });
}

export function interruptSpeech() { if (native) window.Android.stopSpeaking(); else window.speechSynthesis && speechSynthesis.cancel(); }

const words = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
function isEcho(partial, spoken) {
  const p = words(partial), sp = new Set(words(spoken));
  return p.length === 0 || p.filter((w) => sp.has(w)).length / p.length >= 0.6; // mostly the assistant's own words
}

/** Speaks text. With bargeIn, user speech stops the voice; the interrupting sentence is carried to the next listen(). */
export async function speak(text, { bargeIn = false } = {}) {
  if (native) bargeIn = false; // Android: recognizer + TTS at once makes the recognizer steal audio focus and silence the voice
  let interrupted = false, lp = null;
  const spoken = speakRaw(text);
  if (bargeIn) {
    S.partialCb = (p) => { if (!interrupted && !isEcho(p, text)) { interrupted = true; interruptSpeech(); } };
    lp = listenRaw();
  }
  await spoken;
  S.partialCb = null;
  if (lp) {
    if (interrupted) S.carry = await lp; else { abortListen(); await lp; }
  }
}
